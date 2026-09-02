-- DigitalNexCare Schema Migration 04: Row Level Security (RLS) & Policies
-- Permanent Constitution Chunk 2

-- 1. Helper Security Functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role_enum AS $$
  SELECT role FROM public.roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roles
    WHERE user_id = auth.uid()
    AND role IN ('PLATFORM_ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_verifier()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roles
    WHERE user_id = auth.uid()
    AND role IN ('VERIFIER_TRUST_OPS', 'PLATFORM_ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Enable RLS on All Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.practitioner_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_directory_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_directory_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_data_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_external_claims ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_dependants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medical_aid_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_medical_aid_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_providers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.patient_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_practitioner_unlocks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_moderation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_appeals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.commercial_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acquisition_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_campaigns ENABLE ROW LEVEL SECURITY;

-- 3. Policy Definitions

-- A. Profiles & Roles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all roles"
  ON public.roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can grant or alter roles"
  ON public.roles FOR ALL
  USING (public.is_admin());

-- B. Practitioner Directory Policies (Public Search Projection vs Direct Read)
-- Joined providers are publicly readable; external directory items are queried via secure projection
CREATE POLICY "Public can view joined verified providers in directory"
  ON public.practitioner_directory FOR SELECT
  USING (is_joined = TRUE OR public.is_admin() OR public.is_verifier());

CREATE POLICY "Public can read taxonomy specialties and services"
  ON public.specialties FOR SELECT
  USING (TRUE);

CREATE POLICY "Public can read taxonomy services"
  ON public.services FOR SELECT
  USING (TRUE);

CREATE POLICY "Public can read visit reasons"
  ON public.visit_reasons FOR SELECT
  USING (TRUE);

-- C. Snapshots & Ingestion Job Policies (STRICT PRIVATE ADMIN/OPS ONLY)
CREATE POLICY "Snapshots are private to Verifier Ops and Admin"
  ON public.practitioner_source_snapshots FOR ALL
  USING (public.is_verifier());

CREATE POLICY "Ingestion jobs are private to Admin"
  ON public.practitioner_ingestion_jobs FOR ALL
  USING (public.is_admin());

CREATE POLICY "Audit logs are viewable only by Admins"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Data conflicts viewable only by Verifier Ops and Admin"
  ON public.practitioner_data_conflicts FOR ALL
  USING (public.is_verifier());

CREATE POLICY "Duplicates reviewable only by Verifier Ops and Admin"
  ON public.practitioner_duplicate_candidates FOR ALL
  USING (public.is_verifier());

-- D. Provider Self-Verification Prevention
-- Providers can view and update their profile details (bio, fee, languages)
CREATE POLICY "Providers can view own provider profile"
  ON public.providers FOR SELECT
  USING (auth.uid() = id OR public.is_admin() OR public.is_verifier());

CREATE POLICY "Providers can update own info but NEVER verification_status"
  ON public.providers FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Providers cannot alter verification_status away from existing or to VERIFIED
    AND (
      verification_status = (SELECT verification_status FROM public.providers WHERE id = auth.uid())
      OR public.is_verifier()
    )
  );

CREATE POLICY "Only Verifiers can manage provider verifications"
  ON public.provider_verifications FOR ALL
  USING (public.is_verifier());

CREATE POLICY "Providers can view own verification requests"
  ON public.provider_verifications FOR SELECT
  USING (auth.uid() = provider_id OR public.is_verifier());

-- E. Practice Isolation (Practice A cannot see Practice B)
CREATE POLICY "Members can view own organisation"
  ON public.organisations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organisation_memberships
      WHERE organisation_id = public.organisations.id
      AND user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Members can view own practices"
  ON public.practices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organisation_memberships
      WHERE organisation_id = public.practices.organisation_id
      AND user_id = auth.uid()
    ) OR public.is_admin()
  );

-- F. Patient Isolation (Patient A cannot see Patient B)
CREATE POLICY "Patients can view own patient profile"
  ON public.patient_profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Patients can update own patient profile"
  ON public.patient_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Patients can manage own dependants"
  ON public.patient_dependants FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can manage own medical aid memberships"
  ON public.patient_medical_aid_memberships FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can manage own saved providers"
  ON public.saved_providers FOR ALL
  USING (auth.uid() = patient_id);

-- G. Subscriptions & Unlocks (Patients cannot manually forge subscriptions or unlocks)
CREATE POLICY "Public can view subscription plan offerings"
  ON public.patient_subscription_plans FOR SELECT
  USING (TRUE);

CREATE POLICY "Patients can view own subscription"
  ON public.patient_subscriptions FOR SELECT
  USING (auth.uid() = patient_id OR public.is_admin());

-- Modifications to subscriptions require service role or admin
CREATE POLICY "Only system can update patient subscriptions"
  ON public.patient_subscriptions FOR ALL
  USING (public.is_admin());

CREATE POLICY "Patients can view own unlocks"
  ON public.external_practitioner_unlocks FOR SELECT
  USING (auth.uid() = patient_id OR public.is_admin());

-- H. Appointments Isolation
CREATE POLICY "Patients can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = provider_id OR public.is_admin());

CREATE POLICY "Patients can create appointments for themselves"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Providers can update appointments assigned to them"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = provider_id OR auth.uid() = patient_id OR public.is_admin());

CREATE POLICY "Slot holds are readable by patient and provider"
  ON public.slot_holds FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = provider_id OR public.is_admin());

-- I. Medical Schemes & Plans
CREATE POLICY "Public can read active medical schemes and plans"
  ON public.medical_schemes FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Public can read medical plans"
  ON public.medical_plans FOR SELECT
  USING (TRUE);

-- J. Notifications
CREATE POLICY "Users can view and manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

-- K. Invoices & Payments
CREATE POLICY "Users can view own invoices and payments"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
