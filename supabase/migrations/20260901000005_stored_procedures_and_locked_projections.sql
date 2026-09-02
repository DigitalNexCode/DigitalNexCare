-- DigitalNexCare Schema Migration 05: Stored Procedures & Server-Side Projections
-- Permanent Constitution Chunk 2

-- 1. Check if Practitioner is Unlocked by User in Current Billing Cycle
CREATE OR REPLACE FUNCTION public.is_practitioner_unlocked(
  p_patient_id UUID,
  p_practitioner_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_unlocked BOOLEAN := FALSE;
  v_period_start TIMESTAMPTZ;
BEGIN
  IF p_patient_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get current billing period start for patient
  SELECT COALESCE(current_period_start, DATE_TRUNC('month', NOW()))
  INTO v_period_start
  FROM public.patient_subscriptions
  WHERE patient_id = p_patient_id;

  IF v_period_start IS NULL THEN
    v_period_start := DATE_TRUNC('month', NOW());
  END IF;

  -- Check if an unlock record exists for this billing period
  SELECT EXISTS (
    SELECT 1 FROM public.external_practitioner_unlocks
    WHERE patient_id = p_patient_id
      AND practitioner_id = p_practitioner_id
      AND subscription_period_start >= v_period_start
  ) INTO v_is_unlocked;

  RETURN v_is_unlocked;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Projected Practitioner Directory Search (PROTECTS EXTERNAL IDENTITIES SERVER-SIDE)
CREATE OR REPLACE FUNCTION public.search_practitioners_projected(
  p_patient_id UUID DEFAULT NULL,
  p_query TEXT DEFAULT NULL,
  p_specialty_code TEXT DEFAULT NULL,
  p_province province_enum DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_suburb TEXT DEFAULT NULL,
  p_user_lat DOUBLE PRECISION DEFAULT NULL,
  p_user_lng DOUBLE PRECISION DEFAULT NULL,
  p_max_distance_km DOUBLE PRECISION DEFAULT 50.0,
  p_limit INT DEFAULT 30,
  p_offset INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_results JSONB;
BEGIN
  WITH filtered AS (
    SELECT
      p.id,
      p.practitioner_type,
      p.is_joined,
      p.is_bookable,
      p.claim_status,
      p.verification_status,
      p.rating,
      p.review_count,
      p.offers_virtual,
      p.offers_in_person,
      p.province,
      p.city,
      p.suburb,
      s.name AS specialty_name,
      s.code AS specialty_code,
      -- Distance calculation via PostGIS
      CASE
        WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
          ROUND((ST_Distance(
            p.location,
            ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
          ) / 1000.0)::numeric, 1)
        ELSE NULL
      END AS distance_km,
      -- Check unlock status
      CASE
        WHEN p.is_joined = TRUE THEN TRUE
        ELSE public.is_practitioner_unlocked(p_patient_id, p.id)
      END AS is_unlocked,
      -- Sensitive Unlocked Identity Fields
      p.display_name,
      p.title,
      p.practice_name,
      p.address_line,
      p.public_phone,
      p.public_email,
      p.website,
      p.latitude,
      p.longitude,
      p.source_attribution
    FROM public.practitioner_directory p
    LEFT JOIN public.specialties s ON p.primary_category_id = s.id
    WHERE
      (p_query IS NULL OR p.normalized_name ILIKE '%' || p_query || '%' OR p.normalized_practice_name ILIKE '%' || p_query || '%' OR p.suburb ILIKE '%' || p_query || '%')
      AND (p_specialty_code IS NULL OR s.code = p_specialty_code)
      AND (p_province IS NULL OR p.province = p_province)
      AND (p_city IS NULL OR p.city ILIKE '%' || p_city || '%')
      AND (p_suburb IS NULL OR p.suburb ILIKE '%' || p_suburb || '%')
      AND (
        p_user_lat IS NULL OR p_user_lng IS NULL OR
        ST_DWithin(
          p.location,
          ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
          p_max_distance_km * 1000.0
        )
      )
    ORDER BY
      p.is_joined DESC,
      p.rating DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', f.id,
      'practitioner_type', f.practitioner_type,
      'is_joined', f.is_joined,
      'is_bookable', f.is_bookable,
      'specialty', f.specialty_name,
      'specialty_code', f.specialty_code,
      'province', f.province,
      'city', f.city,
      'suburb', f.suburb,
      'approximate_distance_km', f.distance_km,
      'rating', f.rating,
      'review_count', f.review_count,
      'offers_virtual', f.offers_virtual,
      'offers_in_person', f.offers_in_person,
      'is_locked', NOT f.is_unlocked,
      -- STRICT CONDITIONAL REDACTION (Withheld if locked)
      'display_name', CASE WHEN f.is_unlocked THEN f.display_name ELSE NULL END,
      'title', CASE WHEN f.is_unlocked THEN f.title ELSE NULL END,
      'anonymized_title', CASE WHEN NOT f.is_unlocked THEN (COALESCE(f.specialty_name, 'Healthcare Practitioner') || ' in ' || f.suburb) ELSE NULL END,
      'practice_name', CASE WHEN f.is_unlocked THEN f.practice_name ELSE NULL END,
      'address_line', CASE WHEN f.is_unlocked THEN f.address_line ELSE NULL END,
      'public_phone', CASE WHEN f.is_unlocked THEN f.public_phone ELSE NULL END,
      'public_email', CASE WHEN f.is_unlocked THEN f.public_email ELSE NULL END,
      'website', CASE WHEN f.is_unlocked THEN f.website ELSE NULL END,
      'latitude', CASE WHEN f.is_unlocked THEN f.latitude ELSE NULL END,
      'longitude', CASE WHEN f.is_unlocked THEN f.longitude ELSE NULL END,
      'claim_status', f.claim_status,
      'verification_status', f.verification_status,
      'source_attribution', CASE WHEN f.is_unlocked THEN f.source_attribution ELSE NULL END
    )
  ) INTO v_results
  FROM filtered f;

  RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Atomic Unlock Function with Subscription Quota Enforcement
CREATE OR REPLACE FUNCTION public.unlock_external_practitioner_atomic(
  p_patient_id UUID,
  p_practitioner_id UUID,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_plan_id subscription_tier_enum;
  v_period_start TIMESTAMPTZ;
  v_monthly_limit INT;
  v_used_count INT;
  v_is_already_unlocked BOOLEAN;
  v_practitioner RECORD;
BEGIN
  -- 1. Check if patient exists and get active subscription
  SELECT
    s.plan_id,
    COALESCE(s.current_period_start, DATE_TRUNC('month', NOW())),
    p.monthly_external_reveals
  INTO
    v_plan_id,
    v_period_start,
    v_monthly_limit
  FROM public.patient_subscriptions s
  JOIN public.patient_subscription_plans p ON s.plan_id = p.id
  WHERE s.patient_id = p_patient_id;

  -- Default to NEXCARE_FREE if no active record
  IF v_plan_id IS NULL THEN
    v_plan_id := 'NEXCARE_FREE';
    v_period_start := DATE_TRUNC('month', NOW());
    v_monthly_limit := 2; -- Freemium limit = 2
  END IF;

  -- 2. Check if practitioner exists
  SELECT * INTO v_practitioner
  FROM public.practitioner_directory
  WHERE id = p_practitioner_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PRACTITIONER_NOT_FOUND');
  END IF;

  -- Joined providers do not consume reveals
  IF v_practitioner.is_joined = TRUE THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_joined', true,
      'unlocked', true,
      'message', 'Practitioner is a joined DigitalNexCare Provider (Free access)'
    );
  END IF;

  -- 3. Check if already unlocked in this billing period
  SELECT EXISTS (
    SELECT 1 FROM public.external_practitioner_unlocks
    WHERE patient_id = p_patient_id
      AND practitioner_id = p_practitioner_id
      AND subscription_period_start >= v_period_start
  ) INTO v_is_already_unlocked;

  IF v_is_already_unlocked THEN
    RETURN jsonb_build_object(
      'success', true,
      'unlocked', true,
      'already_unlocked', true,
      'remaining_reveals', CASE WHEN v_monthly_limit IS NULL THEN -1 ELSE (v_monthly_limit - (
        SELECT COUNT(*) FROM public.external_practitioner_unlocks
        WHERE patient_id = p_patient_id AND subscription_period_start >= v_period_start
      )) END
    );
  END IF;

  -- 4. Check Current Usage
  SELECT COUNT(*) INTO v_used_count
  FROM public.external_practitioner_unlocks
  WHERE patient_id = p_patient_id
    AND subscription_period_start >= v_period_start;

  -- 5. Quota Verification (v_monthly_limit NULL means Family Unlimited)
  IF v_monthly_limit IS NOT NULL AND v_used_count >= v_monthly_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EXTERNAL_PRACTITIONER_LIMIT_REACHED',
      'plan', v_plan_id,
      'used', v_used_count,
      'limit', v_monthly_limit,
      'message', 'You have reached your external practitioner reveal limit for this billing period.'
    );
  END IF;

  -- 6. Insert Unlock Record Atomically
  INSERT INTO public.external_practitioner_unlocks (
    patient_id,
    practitioner_id,
    subscription_period_start,
    plan_tier,
    ip_address
  ) VALUES (
    p_patient_id,
    p_practitioner_id,
    v_period_start,
    v_plan_id,
    p_ip_address
  );

  -- 7. Audit Log Entry
  INSERT INTO public.audit_logs (
    user_id,
    user_role,
    action,
    resource,
    entity_id,
    diff,
    ip_address
  ) VALUES (
    p_patient_id,
    'PATIENT',
    'UNLOCK_EXTERNAL_PRACTITIONER',
    'practitioner_directory',
    p_practitioner_id,
    jsonb_build_object('plan', v_plan_id, 'used_count_after', v_used_count + 1),
    p_ip_address
  );

  RETURN jsonb_build_object(
    'success', true,
    'unlocked', true,
    'plan', v_plan_id,
    'used_count', v_used_count + 1,
    'remaining_reveals', CASE WHEN v_monthly_limit IS NULL THEN -1 ELSE (v_monthly_limit - (v_used_count + 1)) END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Hold Appointment Slot with Race-Condition Double-Booking Prevention
CREATE OR REPLACE FUNCTION public.hold_appointment_slot(
  p_provider_id UUID,
  p_patient_id UUID,
  p_appointment_type_id UUID,
  p_start_datetime TIMESTAMPTZ,
  p_end_datetime TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
  v_hold_id UUID;
  v_is_already_booked BOOLEAN;
  v_is_already_held BOOLEAN;
BEGIN
  -- 1. Check if already confirmed
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE provider_id = p_provider_id
      AND start_datetime = p_start_datetime
      AND status NOT IN ('CANCELLED', 'RESCHEDULED')
  ) INTO v_is_already_booked;

  IF v_is_already_booked THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_ALREADY_CONFIRMED');
  END IF;

  -- 2. Check if active unexpired hold exists by another patient
  SELECT EXISTS (
    SELECT 1 FROM public.slot_holds
    WHERE provider_id = p_provider_id
      AND start_datetime = p_start_datetime
      AND patient_id != p_patient_id
      AND expires_at > NOW()
  ) INTO v_is_already_held;

  IF v_is_already_held THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_CURRENTLY_HELD');
  END IF;

  -- 3. Delete any expired hold on this slot
  DELETE FROM public.slot_holds
  WHERE provider_id = p_provider_id
    AND start_datetime = p_start_datetime
    AND expires_at <= NOW();

  -- 4. Insert or update slot hold (10-minute hold window)
  INSERT INTO public.slot_holds (
    provider_id,
    patient_id,
    appointment_type_id,
    start_datetime,
    end_datetime,
    expires_at
  ) VALUES (
    p_provider_id,
    p_patient_id,
    p_appointment_type_id,
    p_start_datetime,
    p_end_datetime,
    NOW() + INTERVAL '10 minutes'
  )
  ON CONFLICT (provider_id, start_datetime) DO UPDATE
  SET
    patient_id = EXCLUDED.patient_id,
    appointment_type_id = EXCLUDED.appointment_type_id,
    expires_at = NOW() + INTERVAL '10 minutes'
  RETURNING id INTO v_hold_id;

  RETURN jsonb_build_object(
    'success', true,
    'hold_id', v_hold_id,
    'expires_at', NOW() + INTERVAL '10 minutes'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
