-- ==============================================================================
-- DIGITALNEXCARE — CHUNK 9A DATABASE MIGRATION
-- PRACTITIONER COMMERCIAL MODEL, 7% PLATFORM FEE, BANK ONBOARDING,
-- WEEKLY SETTLEMENTS, PRACTICE FLEX SUBSCRIPTIONS, AND FINANCIAL STATEMENTS
-- ==============================================================================

-- 1. Commercial Global Configuration
CREATE TABLE IF NOT EXISTS commercial_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_platform_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    booking_platform_fee_basis_points INTEGER NOT NULL DEFAULT 700,
    practice_flex_monthly_price_cents INTEGER NOT NULL DEFAULT 14900,
    practice_flex_included_bookings INTEGER NOT NULL DEFAULT 10,
    practice_flex_overage_cents INTEGER NOT NULL DEFAULT 2500,
    settlement_frequency VARCHAR(20) NOT NULL DEFAULT 'WEEKLY',
    settlement_cutoff_day INTEGER NOT NULL DEFAULT 0, -- Sunday
    settlement_payout_day INTEGER NOT NULL DEFAULT 1, -- Monday
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Practice Bank Accounts & Masked Payout Destinations
CREATE TABLE IF NOT EXISTS practice_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    account_holder_name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number_masked TEXT NOT NULL,
    branch_code TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('CHEQUE_CURRENT', 'SAVINGS', 'TRANSMISSION')),
    billing_email TEXT NOT NULL,
    practice_registration_number TEXT NOT NULL,
    tax_vat_number TEXT,
    payment_contact_person TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION'
        CHECK (verification_status IN ('NOT_SUBMITTED', 'SUBMITTED', 'PENDING_VERIFICATION', 'VERIFIED', 'FAILED_VERIFICATION', 'CHANGE_PENDING', 'SUSPENDED')),
    verification_failure_reason TEXT,
    gateway TEXT NOT NULL DEFAULT 'PAYSTACK',
    gateway_subaccount_id TEXT,
    gateway_subaccount_code TEXT,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_practice_bank_account UNIQUE (practice_id)
);

-- 3. Bank Detail Change Requests (Audit & Protection against silent account hijacking)
CREATE TABLE IF NOT EXISTS bank_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    old_account_masked TEXT NOT NULL,
    new_account_masked TEXT NOT NULL,
    new_bank_name TEXT NOT NULL,
    new_branch_code TEXT NOT NULL,
    new_account_type TEXT NOT NULL,
    requested_by UUID NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION'
        CHECK (status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
    notes TEXT,
    verified_by UUID,
    verified_at TIMESTAMPTZ
);

-- 4. Practice Commercial Payment Settings
CREATE TABLE IF NOT EXISTS practice_payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    default_payment_mode TEXT NOT NULL DEFAULT 'ONLINE_OR_PRACTICE'
        CHECK (default_payment_mode IN ('ONLINE_REQUIRED', 'PAY_AT_PRACTICE', 'ONLINE_OR_PRACTICE', 'DEPOSIT_REQUIRED', 'FREE')),
    allow_online_payment BOOLEAN NOT NULL DEFAULT TRUE,
    allow_pay_at_practice BOOLEAN NOT NULL DEFAULT TRUE,
    requires_deposit_by_default BOOLEAN NOT NULL DEFAULT FALSE,
    accepts_commercial_terms BOOLEAN NOT NULL DEFAULT FALSE,
    terms_accepted_at TIMESTAMPTZ,
    terms_accepted_by UUID,
    terms_version TEXT DEFAULT '2026.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_practice_payment_settings UNIQUE (practice_id)
);

-- 5. Per-Appointment-Type Pricing and Payment Mode Config
CREATE TABLE IF NOT EXISTS appointment_type_payment_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_type_id UUID NOT NULL,
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    payment_mode TEXT NOT NULL DEFAULT 'ONLINE_OR_PRACTICE',
    consultation_price_cents INTEGER NOT NULL DEFAULT 70000,
    deposit_amount_cents INTEGER,
    is_price_fixed BOOLEAN NOT NULL DEFAULT TRUE,
    is_estimate BOOLEAN NOT NULL DEFAULT FALSE,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_appointment_type_practice UNIQUE (practice_id, appointment_type_id)
);

-- 6. Practice Commercial Subscriptions (Practice Flex R149/mo)
CREATE TABLE IF NOT EXISTS practice_commercial_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL DEFAULT 'PRACTICE_FLEX',
    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'PAUSED')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    included_bookings INTEGER NOT NULL DEFAULT 10,
    used_bookings INTEGER NOT NULL DEFAULT 0,
    overage_count INTEGER NOT NULL DEFAULT 0,
    overage_charge_cents INTEGER NOT NULL DEFAULT 0,
    monthly_base_cents INTEGER NOT NULL DEFAULT 14900,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    last_billed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_practice_subscription UNIQUE (practice_id, plan_code)
);

-- 7. Practice Booking Allowance Usages (Pay-at-Practice bookings tracking)
CREATE TABLE IF NOT EXISTS practice_booking_allowance_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL,
    appointment_status TEXT NOT NULL,
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    is_qualifying BOOLEAN NOT NULL DEFAULT FALSE,
    is_overage BOOLEAN NOT NULL DEFAULT FALSE,
    overage_fee_cents INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Practice Weekly Settlements (Enforcing unique settlement per period for idempotency)
CREATE TABLE IF NOT EXISTS practice_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_number TEXT NOT NULL UNIQUE,
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    gross_amount_cents INTEGER NOT NULL DEFAULT 0,
    platform_fee_cents INTEGER NOT NULL DEFAULT 0,
    gateway_fee_cents INTEGER NOT NULL DEFAULT 0,
    refund_amount_cents INTEGER NOT NULL DEFAULT 0,
    adjustment_amount_cents INTEGER NOT NULL DEFAULT 0,
    net_amount_cents INTEGER NOT NULL DEFAULT 0,
    item_count INTEGER NOT NULL DEFAULT 0,
    gateway TEXT NOT NULL DEFAULT 'PAYSTACK',
    status TEXT NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'CALCULATING', 'READY', 'PROCESSING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'ON_HOLD', 'REVERSED')),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    gateway_settlement_reference TEXT,
    destination_account_masked TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_practice_period_settlement UNIQUE (practice_id, period_start, period_end)
);

-- 9. Practice Settlement Items (Line item breakdown per booking)
CREATE TABLE IF NOT EXISTS practice_settlement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES practice_settlements(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL,
    payment_id TEXT NOT NULL,
    charge_id TEXT NOT NULL,
    booking_reference TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    appointment_type TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    gross_amount_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL,
    gateway_fee_cents INTEGER NOT NULL,
    refund_cents INTEGER NOT NULL DEFAULT 0,
    adjustment_cents INTEGER NOT NULL DEFAULT 0,
    net_cents INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Manual Financial Adjustments (Credits/Debits)
CREATE TABLE IF NOT EXISTS manual_financial_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    adjustment_number TEXT NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    reason TEXT NOT NULL,
    supporting_reference TEXT,
    applied_to_settlement_id UUID REFERENCES practice_settlements(id),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Immutable Financial Statements (Weekly & Monthly)
CREATE TABLE IF NOT EXISTS financial_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_number TEXT NOT NULL UNIQUE,
    statement_type TEXT NOT NULL CHECK (statement_type IN ('WEEKLY_SETTLEMENT', 'MONTHLY_PRACTICE_SUMMARY', 'TAX_INVOICE')),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    gross_paid_bookings_cents INTEGER NOT NULL DEFAULT 0,
    platform_fees_cents INTEGER NOT NULL DEFAULT 0,
    gateway_fees_cents INTEGER NOT NULL DEFAULT 0,
    practice_flex_subscription_cents INTEGER NOT NULL DEFAULT 0,
    practice_flex_overage_cents INTEGER NOT NULL DEFAULT 0,
    total_completed_pay_at_practice_bookings INTEGER NOT NULL DEFAULT 0,
    refunds_cents INTEGER NOT NULL DEFAULT 0,
    adjustments_cents INTEGER NOT NULL DEFAULT 0,
    net_settlement_or_due_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'SETTLED', 'CANCELLED')),
    destination_account_masked TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Patient Payment Receipts
CREATE TABLE IF NOT EXISTS payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL UNIQUE,
    payment_reference TEXT NOT NULL,
    appointment_id UUID NOT NULL,
    patient_name TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    practitioner_name TEXT NOT NULL,
    practice_name TEXT NOT NULL,
    practice_address TEXT,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    appointment_type TEXT NOT NULL,
    gross_amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    payment_gateway TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'COMPLETED',
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    support_contact TEXT NOT NULL,
    terms_disclaimer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Financial Audit Logs
CREATE TABLE IF NOT EXISTS financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Practice Staff Memberships (Managers, Receptionists, Billing, Doctors)
CREATE TABLE IF NOT EXISTS public.practice_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'PRACTICE_MANAGER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_practice_staff UNIQUE (practice_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_practice_staff_practice ON public.practice_staff(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_staff_user ON public.practice_staff(user_id);

-- 15. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_settlements_practice_period ON practice_settlements(practice_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement ON practice_settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_allowance_usages_practice ON practice_booking_allowance_usages(practice_id, is_qualifying);
CREATE INDEX IF NOT EXISTS idx_financial_audit_logs_practice ON financial_audit_logs(practice_id, created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_appointment ON payment_receipts(appointment_id);

-- 16. Helper Security Function: can_access_practice_finance
CREATE OR REPLACE FUNCTION public.can_access_practice_finance(p_practice_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Platform Admins, Super Admins, Verifiers, and Finance Billing
    IF (auth.jwt() ->> 'role' IN ('PLATFORM_ADMIN', 'SUPER_ADMIN', 'FINANCE_BILLING', 'VERIFIER_TRUST_OPS'))
       OR EXISTS (
           SELECT 1 FROM public.roles
           WHERE user_id = auth.uid()
           AND role IN ('PLATFORM_ADMIN', 'SUPER_ADMIN', 'FINANCE_BILLING', 'VERIFIER_TRUST_OPS')
       ) THEN
        RETURN TRUE;
    END IF;

    -- 2. Direct Practice Staff membership
    IF EXISTS (
        SELECT 1 FROM public.practice_staff
        WHERE practice_id = p_practice_id
        AND user_id = auth.uid()
        AND is_active = TRUE
    ) THEN
        RETURN TRUE;
    END IF;

    -- 3. Organisation Membership (practice -> organisation)
    IF EXISTS (
        SELECT 1 FROM public.practices p
        JOIN public.organisation_memberships om ON om.organisation_id = p.organisation_id
        WHERE p.id = p_practice_id
        AND om.user_id = auth.uid()
        AND om.is_active = TRUE
    ) THEN
        RETURN TRUE;
    END IF;

    -- 4. Provider linked to practice locations
    IF EXISTS (
        SELECT 1 FROM public.locations l
        JOIN public.provider_locations pl ON pl.location_id = l.id
        WHERE l.practice_id = p_practice_id
        AND pl.provider_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 17. Row Level Security Policies
ALTER TABLE public.practice_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_type_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_commercial_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_booking_allowance_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_financial_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;

-- Practice Staff Policies
CREATE POLICY ps_staff_read ON public.practice_staff
    FOR SELECT TO authenticated
    USING (public.can_access_practice_finance(practice_id));

-- Practice Bank Accounts
CREATE POLICY pba_practice_read ON public.practice_bank_accounts
    FOR SELECT TO authenticated
    USING (public.can_access_practice_finance(practice_id));

CREATE POLICY pba_admin_manage ON public.practice_bank_accounts
    FOR ALL TO authenticated
    USING (public.can_access_practice_finance(practice_id));

-- Bank Change Requests
CREATE POLICY bcr_practice_read ON public.bank_change_requests
    FOR SELECT TO authenticated
    USING (public.can_access_practice_finance(practice_id));

CREATE POLICY bcr_practice_insert ON public.bank_change_requests
    FOR INSERT TO authenticated
    WITH CHECK (public.can_access_practice_finance(practice_id));

-- Practice Payment Settings
CREATE POLICY pps_practice_read ON public.practice_payment_settings
    FOR SELECT TO authenticated
    USING (public.can_access_practice_finance(practice_id));

CREATE POLICY pps_practice_manage ON public.practice_payment_settings
    FOR ALL TO authenticated
    USING (public.can_access_practice_finance(practice_id));

-- Appointment Type Payment Configs
CREATE POLICY atpc_public_read ON public.appointment_type_payment_configs
    FOR SELECT TO authenticated, anon
    USING (TRUE);

CREATE POLICY atpc_practice_manage ON public.appointment_type_payment_configs
    FOR ALL TO authenticated
    USING (public.can_access_practice_finance(practice_id));

-- Commercial Subscriptions & Booking Allowance Usages
CREATE POLICY pcs_practice_read ON public.practice_commercial_subscriptions
    FOR SELECT TO authenticated
    USING (public.can_access_practice_finance(practice_id));

CREATE POLICY pbau_practice_read ON public.practice_booking_allowance_usages
    FOR SELECT TO authenticated
    USING (public.can_access_practice_finance(practice_id));

-- Settlements & Settlement Line Items
CREATE POLICY ps_practice_read ON public.practice_settlements
    FOR SELECT TO authenticated
    USING (public.can_access_practice_finance(practice_id));

CREATE POLICY psi_practice_read ON public.practice_settlement_items
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.practice_settlements ps
        WHERE ps.id = settlement_id
        AND public.can_access_practice_finance(ps.practice_id)
    ));

-- Financial Statements & Manual Adjustments
CREATE POLICY fs_practice_read ON public.financial_statements
    FOR SELECT TO authenticated
    USING (public.can_access_practice_finance(practice_id));

CREATE POLICY mfa_practice_read ON public.manual_financial_adjustments
    FOR SELECT TO authenticated
    USING (public.can_access_practice_finance(practice_id));

-- Patient Payment Receipts (Readable by authenticated users)
CREATE POLICY pr_patient_read ON public.payment_receipts
    FOR SELECT TO authenticated
    USING (TRUE);

-- Financial Audit Logs
CREATE POLICY fal_admin_read ON public.financial_audit_logs
    FOR SELECT TO authenticated
    USING (practice_id IS NULL OR public.can_access_practice_finance(practice_id));
