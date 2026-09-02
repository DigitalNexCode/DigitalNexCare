-- DigitalNexCare Schema Migration 02: Provider, Patient, Subscriptions & Medical Aid
-- Permanent Constitution Chunk 2

-- 1. Provider Domain Tables
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Dr',
  bio TEXT,
  experience_years INT DEFAULT 5,
  consultation_fee_cents INT DEFAULT 65000, -- R650.00
  photo_url TEXT,
  languages TEXT[] DEFAULT ARRAY['English', 'Afrikaans'],
  gender TEXT,
  is_accepting_new_patients BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status verification_status_enum NOT NULL DEFAULT 'DRAFT',
  claim_status claim_status_enum NOT NULL DEFAULT 'UNCLAIMED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  council_type TEXT NOT NULL, -- 'HPCSA', 'SANC', 'SAPC', 'AHPCSA'
  registration_number TEXT NOT NULL UNIQUE,
  register_category TEXT, -- 'Independent Practice', 'Supervised'
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  valid_until DATE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL,
  institution TEXT NOT NULL,
  year_obtained INT NOT NULL,
  certificate_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  status verification_status_enum NOT NULL DEFAULT 'SUBMITTED',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  notes TEXT,
  recheck_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.provider_verifications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'NATIONAL_ID', 'COUNCIL_CERTIFICATE', 'PROOF_OF_ADDRESS', 'MALPRACTICE_INSURANCE'
  file_url TEXT NOT NULL,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  practice_number TEXT,
  description TEXT,
  logo_url TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Main Clinic", "Sunninghill Branch"
  address_line TEXT NOT NULL,
  suburb TEXT NOT NULL,
  city TEXT NOT NULL,
  province province_enum NOT NULL,
  postal_code TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location geography(Point, 4326),
  phone TEXT,
  wheelchair_accessible BOOLEAN NOT NULL DEFAULT TRUE,
  parking_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(provider_id, location_id)
);

CREATE TABLE IF NOT EXISTS public.provider_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(provider_id, specialty_id)
);

CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_duration_minutes INT,
  custom_price_cents INT,
  UNIQUE(provider_id, service_id)
);

-- 2. Patient Domain Tables
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  preferred_language TEXT DEFAULT 'English',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patient_dependants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- 'SPOUSE', 'CHILD', 'PARENT', 'OTHER'
  id_number_or_dob TEXT NOT NULL,
  medical_aid_dependant_code TEXT NOT NULL DEFAULT '00',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Medical Aid Domain Tables
CREATE TABLE IF NOT EXISTS public.medical_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  administrator TEXT,
  logo_url TEXT,
  contact_phone TEXT,
  website TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.medical_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.medical_schemes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  network_type TEXT, -- 'OPEN', 'DESIGNATED_SERVICE_PROVIDER', 'KEYCARE'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.medical_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES public.medical_schemes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patient_medical_aid_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES public.medical_schemes(id) ON DELETE RESTRICT,
  plan_id UUID REFERENCES public.medical_plans(id) ON DELETE SET NULL,
  membership_number TEXT NOT NULL,
  main_member_name TEXT NOT NULL,
  dependant_code TEXT NOT NULL DEFAULT '00',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_medical_aid_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES public.medical_schemes(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.medical_plans(id) ON DELETE CASCADE,
  accepts_direct_claims BOOLEAN NOT NULL DEFAULT TRUE,
  network_status TEXT DEFAULT 'IN_NETWORK', -- 'IN_NETWORK', 'OUT_OF_NETWORK', 'DSP_CONTRACTED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, scheme_id, plan_id)
);

CREATE TABLE IF NOT EXISTS public.saved_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id, practitioner_id)
);

-- 4. Subscription & Entitlement Domain Tables
CREATE TABLE IF NOT EXISTS public.patient_subscription_plans (
  id subscription_tier_enum PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  price_cents INT NOT NULL, -- in ZAR Cents
  monthly_external_reveals INT, -- NULL = unlimited
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  features JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patient_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  plan_id subscription_tier_enum NOT NULL REFERENCES public.patient_subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method TEXT,
  payment_gateway_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id)
);

CREATE TABLE IF NOT EXISTS public.subscription_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.patient_subscriptions(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL, -- 'EXTERNAL_REVEALS', 'PRIORITY_SUPPORT', 'FAMILY_SHARING'
  value_limit INT, -- NULL for unlimited
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.patient_subscriptions(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  reveals_used INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.patient_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'SUBSCRIBED', 'UPGRADED', 'DOWNGRADED', 'RENEWED', 'PAYMENT_FAILED', 'CANCELLED'
  previous_plan subscription_tier_enum,
  new_plan subscription_tier_enum,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crucial: External Practitioner Unlock Records
CREATE TABLE IF NOT EXISTS public.external_practitioner_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  subscription_period_start TIMESTAMPTZ NOT NULL,
  plan_tier subscription_tier_enum NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  UNIQUE(patient_id, practitioner_id, subscription_period_start)
);
