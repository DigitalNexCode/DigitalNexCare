-- Paystack webhook idempotency ledger.
-- Webhooks are authenticated by the Edge Function and written with service-role access.
CREATE TABLE IF NOT EXISTS public.paystack_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  gateway_transaction_id TEXT,
  reference TEXT,
  signature TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  processing_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_paystack_webhook_reference
  ON public.paystack_webhook_events(reference);

ALTER TABLE public.paystack_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS uq_subscription_entitlements_key
  ON public.subscription_entitlements(subscription_id, entitlement_key);
