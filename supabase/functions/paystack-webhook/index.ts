import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || '*',
  'Access-Control-Allow-Headers': 'content-type, x-paystack-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function hex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacSha512(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function metadataValue(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function findInitializedPayment(reference: string, userId: string, expectedPurpose: string, amount: unknown, currency: unknown) {
  const { data: payment, error } = await supabase.from('payments')
    .select('id,user_id,gateway,amount_cents,currency,status,raw_response')
    .eq('payment_reference', reference).maybeSingle();
  if (error) throw error;
  if (!payment || payment.user_id !== userId || payment.gateway !== 'PAYSTACK') throw new Error('UNKNOWN_PAYSTACK_PAYMENT');
  if (Number(payment.amount_cents) !== Number(amount) || String(payment.currency).toUpperCase() !== String(currency || '').toUpperCase()) throw new Error('PAYSTACK_AMOUNT_MISMATCH');
  if (payment.status === 'COMPLETED') return { ...payment, alreadyCompleted: true };
  if (!['INITIALIZED', 'PROCESSING'].includes(String(payment.status).toUpperCase())) throw new Error('PAYSTACK_PAYMENT_NOT_PAYABLE');
  const storedPurpose = expectedPurpose === 'PATIENT_SUBSCRIPTION'
    ? payment.raw_response?.plan_id
    : expectedPurpose === 'RESELLER_REGISTRATION'
      ? payment.raw_response?.purpose
      : payment.raw_response?.product_id;
  if (expectedPurpose === 'RESELLER_REGISTRATION' && storedPurpose !== 'RESELLER_REGISTRATION') throw new Error('PAYSTACK_PAYMENT_METADATA_MISMATCH');
  return { ...payment, alreadyCompleted: false };
}

async function completeInitializedPayment(payment: any, payload: any, transaction: any, eventType: string, paymentContext: Record<string, string>) {
  const { data: updated, error } = await supabase.from('payments').update({
    status: 'COMPLETED',
    gateway_transaction_id: String(transaction.id || transaction.reference),
    payment_method: transaction.channel || null,
    raw_response: { ...(payment.raw_response || {}), ...paymentContext, paystack_webhook: payload },
    updated_at: new Date().toISOString(),
  }).eq('id', payment.id).in('status', ['INITIALIZED', 'PROCESSING']).select('id').maybeSingle();
  if (error) throw error;
  if (!updated) throw new Error('PAYSTACK_PAYMENT_STATE_CHANGED');
  const { error: eventError } = await supabase.from('payment_events').insert({ payment_id: payment.id, event_type: eventType, gateway_signature: null, payload });
  if (eventError) throw eventError;
}

async function processChargeSuccess(payload: any) {
  const transaction = payload.data || {};
  const metadata = transaction.metadata || {};
  const userId = metadataValue(metadata, 'user_id') || metadataValue(metadata, 'userId');
  const planId = metadataValue(metadata, 'plan_id') || metadataValue(metadata, 'planId');
  const reference = String(transaction.reference || '');
  if (!userId || !planId || !reference || String(transaction.status || '').toLowerCase() !== 'success') throw new Error('PAYSTACK_METADATA_INCOMPLETE');
  if (metadataValue(metadata, 'internal_reference') !== reference) throw new Error('PAYSTACK_REFERENCE_MISMATCH');

  const payment = await findInitializedPayment(reference, userId, 'PATIENT_SUBSCRIPTION', transaction.amount, transaction.currency);
  if (payment.raw_response?.plan_id && payment.raw_response.plan_id !== planId) throw new Error('PAYSTACK_PAYMENT_METADATA_MISMATCH');
  if (payment.alreadyCompleted) return;

  const { data: plan, error: planError } = await supabase
    .from('patient_subscription_plans')
    .select('id, price_cents, monthly_external_reveals')
    .eq('id', planId)
    .maybeSingle();
  if (planError) throw planError;
  if (!plan || String(transaction.currency || '').toUpperCase() !== 'ZAR') {
    throw new Error('PAYSTACK_AMOUNT_MISMATCH');
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: existingSubscription, error: existingSubscriptionError } = await supabase
    .from('patient_subscriptions')
    .select('id, plan_id, status')
    .eq('patient_id', userId)
    .maybeSingle();
  if (existingSubscriptionError) throw existingSubscriptionError;

  let eventType = 'SUBSCRIBED';
  if (existingSubscription) {
    if (existingSubscription.plan_id === plan.id) {
      eventType = 'RENEWED';
    } else {
      const { data: previousPlan, error: previousPlanError } = await supabase
        .from('patient_subscription_plans')
        .select('price_cents')
        .eq('id', existingSubscription.plan_id)
        .maybeSingle();
      if (previousPlanError) throw previousPlanError;
      eventType = previousPlan && Number(plan.price_cents) < Number(previousPlan.price_cents) ? 'DOWNGRADED' : 'UPGRADED';
    }
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from('patient_subscriptions')
    .upsert({
      patient_id: userId,
      plan_id: plan.id,
      status: 'ACTIVE',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      payment_method: 'PAYSTACK',
      payment_gateway_ref: reference,
      updated_at: now.toISOString(),
    }, { onConflict: 'patient_id' })
    .select('id, plan_id, current_period_start, current_period_end')
    .single();
  if (subscriptionError) throw subscriptionError;

  const { error: entitlementError } = await supabase.from('subscription_entitlements').upsert({
    subscription_id: subscription.id,
    entitlement_key: 'EXTERNAL_REVEALS',
    value_limit: plan.monthly_external_reveals,
  }, { onConflict: 'subscription_id,entitlement_key' });
  if (entitlementError) throw entitlementError;

  const { error: usageError } = await supabase.from('subscription_usage').upsert({
    subscription_id: subscription.id,
    period_start: subscription.current_period_start,
    period_end: subscription.current_period_end,
    reveals_used: 0,
  }, { onConflict: 'subscription_id,period_start,period_end' });
  if (usageError) throw usageError;

  const { error: eventError } = await supabase.from('subscription_events').insert({
    subscription_id: subscription.id,
    event_type: eventType,
    new_plan: plan.id,
    metadata: { gateway: 'PAYSTACK', reference, transaction_id: transaction.id },
  });
  if (eventError) throw eventError;

  await completeInitializedPayment(payment, payload, transaction, 'CHARGE_SUCCESS', { plan_id: planId });
}

async function processProviderChargeSuccess(payload: any) {
  const transaction = payload.data || {};
  const metadata = transaction.metadata || {};
  const providerId = metadataValue(metadata, 'provider_id') || metadataValue(metadata, 'user_id');
  const productId = metadataValue(metadata, 'product_id');
  const reference = String(transaction.reference || '');
  if (!providerId || !productId || !reference || String(transaction.status || '').toLowerCase() !== 'success') throw new Error('PAYSTACK_PROVIDER_METADATA_INCOMPLETE');
  if (metadataValue(metadata, 'internal_reference') !== reference) throw new Error('PAYSTACK_REFERENCE_MISMATCH');

  const payment = await findInitializedPayment(reference, providerId, 'PROVIDER_SUBSCRIPTION', transaction.amount, transaction.currency);
  if (payment.raw_response?.product_id && payment.raw_response.product_id !== productId) throw new Error('PAYSTACK_PAYMENT_METADATA_MISMATCH');
  if (payment.alreadyCompleted) return;

  const { data: product, error: productError } = await supabase.from('commercial_products')
    .select('id,price_cents,currency,billing_interval,target_audience')
    .eq('id', productId)
    .maybeSingle();
  if (productError) throw productError;
  if (!product || !['PRACTICE', 'PROVIDER'].includes(String(product.target_audience)) || String(product.billing_interval).toUpperCase() !== 'MONTHLY' || String(product.currency || '').toUpperCase() !== String(transaction.currency || '').toUpperCase()) {
    throw new Error('PAYSTACK_PROVIDER_AMOUNT_MISMATCH');
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const { error: subscriptionError } = await supabase.from('provider_subscriptions').upsert({
    provider_id: providerId,
    product_id: product.id,
    status: 'ACTIVE',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: 'provider_id' });
  if (subscriptionError) throw subscriptionError;

  await completeInitializedPayment(payment, payload, transaction, 'PRACTICE_SUBSCRIPTION_CHARGE_SUCCESS', { product_id: productId });
}

async function processWebhook(payload: any) {
  if (payload.event === 'refund.processed') {
    const reference = payload.data?.transaction?.reference;
    if (!reference) throw new Error('REFUND_REFERENCE_REQUIRED');
    const { data: payment, error: lookupError } = await supabase.from('payments').select('id,user_id,gateway,raw_response').eq('payment_reference', reference).maybeSingle();
    if (lookupError) throw lookupError;
    if (!payment || payment.gateway !== 'PAYSTACK') throw new Error('UNKNOWN_REFUNDED_PAYMENT');
    const { error } = await supabase.from('payments').update({ status: 'REFUNDED', updated_at: new Date().toISOString() }).eq('id', payment.id).neq('status', 'REFUNDED');
    if (error) throw error;
    const paymentMetadata = payment.raw_response?.paystack_webhook?.data?.metadata || payment.raw_response?.metadata || {};
    if (payment.raw_response?.purpose === 'RESELLER_REGISTRATION' || paymentMetadata.purpose === 'RESELLER_REGISTRATION') return;
    if (payment.raw_response?.plan_id || paymentMetadata.plan_id || paymentMetadata.planId) {
      const { error: subscriptionError } = await supabase.from('patient_subscriptions').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('payment_gateway_ref', reference);
      if (subscriptionError) throw subscriptionError;
    } else if (payment.raw_response?.product_id || paymentMetadata.product_id) {
      const productId = payment.raw_response?.product_id || paymentMetadata.product_id;
      const { error: subscriptionError } = await supabase.from('provider_subscriptions').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('provider_id', payment.user_id).eq('product_id', productId);
      if (subscriptionError) throw subscriptionError;
    }
    return;
  }
  if (payload.event === 'charge.success') {
    const metadata = payload.data?.metadata || {};
    if (metadata.purpose === 'RESELLER_REGISTRATION') {
      const transaction = payload.data;
      if (Number(transaction.amount) !== 6500 || transaction.currency !== 'ZAR' || !transaction.reference || String(transaction.status || '').toLowerCase() !== 'success') throw new Error('RESELLER_PAYMENT_MISMATCH');
      if (metadataValue(metadata, 'internal_reference') !== String(transaction.reference)) throw new Error('PAYSTACK_REFERENCE_MISMATCH');
      if (!metadata.user_id) throw new Error('RESELLER_USER_REQUIRED');
      const payment = await findInitializedPayment(transaction.reference, String(metadata.user_id), 'RESELLER_REGISTRATION', transaction.amount, transaction.currency);
      if (payment.amount_cents !== 6500 || payment.raw_response?.purpose !== 'RESELLER_REGISTRATION') throw new Error('RESELLER_PAYMENT_MISMATCH');
      if (payment.alreadyCompleted) return;
      await completeInitializedPayment(payment, payload, transaction, 'RESELLER_REGISTRATION_CHARGE_SUCCESS', { purpose: 'RESELLER_REGISTRATION' });
      return;
    }
    if (metadataValue(metadata, 'product_id') && ['PRACTICE', 'PROVIDER'].includes(String(metadata.audience || '').toUpperCase())) return processProviderChargeSuccess(payload);
    return processChargeSuccess(payload);
  }
  if (payload.event === 'invoice.payment_failed') {
    const reference = payload.data?.subscription?.subscription_code || payload.data?.reference;
    if (reference) {
      await supabase.from('patient_subscriptions').update({ status: 'PAST_DUE', updated_at: new Date().toISOString() }).eq('payment_gateway_ref', reference);
    }
    return;
  }
  if (payload.event === 'subscription.disable') {
    const reference = payload.data?.subscription_code;
    if (reference) {
      await supabase.from('patient_subscriptions').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('payment_gateway_ref', reference);
    }
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'POST_REQUIRED' }, 405);

  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret || !signature) return json({ error: 'SIGNATURE_REQUIRED' }, 401);

  const expected = await hmacSha512(secret, rawBody);
  if (!safeEqual(expected, signature.toLowerCase())) return json({ error: 'INVALID_SIGNATURE' }, 401);

  let payload: any;
  try { payload = JSON.parse(rawBody); } catch { return json({ error: 'INVALID_JSON' }, 400); }

  const transactionId = payload.data?.id ? String(payload.data.id) : null;
  const reference = payload.data?.reference ? String(payload.data.reference) : null;
  const eventKey = `${payload.event || 'unknown'}:${transactionId || reference || await hmacSha512(secret, rawBody)}`;
  const { data: recorded, error: recordError } = await supabase.from('paystack_webhook_events').insert({
    event_key: eventKey,
    event_type: payload.event || 'unknown',
    gateway_transaction_id: transactionId,
    reference,
    signature,
    payload,
    status: 'PROCESSING',
  }).select('id').maybeSingle();

  if (recordError?.code === '23505') {
    const { data: previous } = await supabase.from('paystack_webhook_events').select('id, status').eq('event_key', eventKey).maybeSingle();
    if (!previous || previous.status === 'PROCESSED' || previous.status === 'PROCESSING') return json({ received: true, duplicate: true });
    const { data: claimed, error: claimError } = await supabase.from('paystack_webhook_events').update({ status: 'PROCESSING', processing_error: null }).eq('id', previous.id).in('status', ['FAILED', 'RECEIVED']).select('id').maybeSingle();
    if (claimError) return json({ error: 'WEBHOOK_CLAIM_FAILED' }, 500);
    if (!claimed) return json({ received: true, duplicate: true });
    try {
      await processWebhook(payload);
      const { error: updateError } = await supabase.from('paystack_webhook_events').update({ status: 'PROCESSED', processed_at: new Date().toISOString(), processing_error: null }).eq('id', previous.id);
      if (updateError) throw updateError;
      return json({ received: true, processed: true, retried: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PROCESSING_FAILED';
      await supabase.from('paystack_webhook_events').update({ status: 'FAILED', processing_error: message }).eq('id', previous.id);
      return json({ error: message }, 500);
    }
  }
  if (recordError || !recorded) return json({ error: 'WEBHOOK_RECORD_FAILED' }, 500);

  try {
    await processWebhook(payload);
    const { error: updateError } = await supabase.from('paystack_webhook_events').update({ status: 'PROCESSED', processed_at: new Date().toISOString() }).eq('id', recorded.id);
    if (updateError) throw updateError;
    return json({ received: true, processed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PROCESSING_FAILED';
    await supabase.from('paystack_webhook_events').update({ status: 'FAILED', processing_error: message }).eq('id', recorded.id);
    return json({ error: message }, 500);
  }
});
