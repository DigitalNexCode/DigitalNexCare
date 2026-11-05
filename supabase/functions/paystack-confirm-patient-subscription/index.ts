import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-digitalnexcare-client, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-client-version, traceparent, tracestate, baggage',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
});

const hex = (bytes: Uint8Array) => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

async function hmacSha512(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    const requestedHeaders = request.headers.get('Access-Control-Request-Headers');
    return new Response('ok', {
      headers: {
        ...corsHeaders,
        ...(requestedHeaders ? { 'Access-Control-Allow-Headers': requestedHeaders } : {}),
        Vary: 'Origin, Access-Control-Request-Headers',
      },
    });
  }
  const isPaystackReturn = request.method === 'GET';
  if (!isPaystackReturn && request.method !== 'POST') return json({ error: 'GET_OR_POST_REQUIRED' }, 405);

  const returnToDashboard = (reference: string, status: 'active' | 'processing' | 'failed') => {
    const destination = new URL('https://care.digitalnexcode.co.za/patient/subscription');
    destination.searchParams.set('payment', 'pending');
    destination.searchParams.set('reference', reference);
    destination.searchParams.set('payment_status', status);
    return Response.redirect(destination.toString(), 303);
  };

  const respond = (reference: string, body: Record<string, unknown>, statusCode = 200) => {
    if (isPaystackReturn) {
      const status = body.status === 'active' ? 'active' : body.status === 'failed' || body.error ? 'failed' : 'processing';
      return returnToDashboard(reference, status);
    }
    return json(body, statusCode);
  };

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !paystackSecret) return json({ error: 'PAYMENT_SERVICE_NOT_CONFIGURED' }, 503);

  let userId: string | null = null;
  if (!isPaystackReturn) {
    const authorization = request.headers.get('Authorization');
    if (!authorization) return json({ error: 'AUTHENTICATION_REQUIRED' }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'AUTHENTICATION_REQUIRED' }, 401);
    userId = user.id;
  }

  const body = isPaystackReturn ? null : await request.json().catch(() => null) as { reference?: unknown } | null;
  const rawReference = isPaystackReturn ? new URL(request.url).searchParams.get('reference') : body?.reference;
  const reference = typeof rawReference === 'string' ? rawReference.trim() : '';
  if (!reference || reference.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(reference)) {
    return isPaystackReturn ? returnToDashboard('', 'failed') : json({ error: 'VALID_PAYMENT_REFERENCE_REQUIRED' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: payment, error: paymentError } = await admin.from('payments')
    .select('id,user_id,gateway,amount_cents,currency,status,raw_response,payment_reference')
    .eq('payment_reference', reference)
    .maybeSingle();
  if (paymentError) return respond(reference, { error: 'PAYMENT_LOOKUP_FAILED' }, 500);
  if (!payment || (!isPaystackReturn && payment.user_id !== userId) || payment.gateway !== 'PAYSTACK') return respond(reference, { error: 'PAYMENT_NOT_FOUND' }, 404);
  userId = payment.user_id;

  const { data: currentSubscription, error: subscriptionLookupError } = await admin.from('patient_subscriptions')
    .select('status,plan_id,current_period_end')
    .eq('patient_id', userId)
    .maybeSingle();
  if (subscriptionLookupError) return respond(reference, { error: 'SUBSCRIPTION_LOOKUP_FAILED' }, 500);
  if (String(payment.status).toUpperCase() === 'COMPLETED') {
    const active = currentSubscription && String(currentSubscription.status).toUpperCase() === 'ACTIVE';
    return respond(reference, { status: active ? 'active' : 'processing', plan_id: active ? currentSubscription.plan_id : null });
  }
  if (!['INITIALIZED', 'PROCESSING'].includes(String(payment.status).toUpperCase())) return respond(reference, { status: 'failed' });

  const planId = typeof payment.raw_response?.plan_id === 'string' ? payment.raw_response.plan_id : '';
  if (!planId) return respond(reference, { error: 'PAYMENT_PLAN_MISSING' }, 409);

  let verifyResponse: Response;
  try {
    verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackSecret}`, 'Cache-Control': 'no-cache' },
    });
  } catch {
    return respond(reference, { status: 'processing', message: 'Payment confirmation is temporarily unavailable.' }, 202);
  }
  const verifyResult = await verifyResponse.json().catch(() => null);
  if (!verifyResponse.ok || !verifyResult?.status || !verifyResult?.data) {
    return respond(reference, { status: 'processing', message: 'Payment confirmation is still being checked.' }, 202);
  }

  const transaction = verifyResult.data;
  if (String(transaction.reference || '') !== reference) return respond(reference, { error: 'PAYSTACK_REFERENCE_MISMATCH' }, 409);
  const transactionStatus = String(transaction.status || '').toLowerCase();
  if (transactionStatus !== 'success') {
    if (['failed', 'abandoned', 'reversed'].includes(transactionStatus)) {
      await admin.from('payments').update({ status: 'FAILED', updated_at: new Date().toISOString() }).eq('id', payment.id).in('status', ['INITIALIZED', 'PROCESSING']);
      return respond(reference, { status: 'failed' });
    }
    return respond(reference, { status: 'processing' }, 202);
  }
  if (Number(transaction.amount) !== Number(payment.amount_cents) || String(transaction.currency || '').toUpperCase() !== String(payment.currency || '').toUpperCase() || String(transaction.currency || '').toUpperCase() !== 'ZAR') {
    return respond(reference, { error: 'PAYSTACK_AMOUNT_MISMATCH' }, 409);
  }

  const metadata = transaction.metadata || {};
  if (String(metadata.user_id || metadata.userId || '') !== userId || String(metadata.plan_id || metadata.planId || '') !== planId || String(metadata.internal_reference || '') !== reference) {
    return respond(reference, { error: 'PAYSTACK_PAYMENT_METADATA_MISMATCH' }, 409);
  }

  // Reuse the signed webhook processor so callback confirmation and Paystack's
  // webhook follow the same idempotent activation path.
  const webhookPayload = JSON.stringify({ event: 'charge.success', data: transaction });
  const signature = await hmacSha512(paystackSecret, webhookPayload);
  let webhookResponse: Response;
  try {
    webhookResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/paystack-webhook`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
        'x-paystack-signature': signature,
      },
      body: webhookPayload,
    });
  } catch {
    return respond(reference, { status: 'processing', message: 'Payment is confirmed; subscription activation is being retried.' }, 202);
  }

  const webhookResult = await webhookResponse.json().catch(() => null);
  if (!webhookResponse.ok) return respond(reference, { error: webhookResult?.error || 'SUBSCRIPTION_ACTIVATION_FAILED' }, 502);

  const { data: activated, error: activationLookupError } = await admin.from('patient_subscriptions')
    .select('status,plan_id,current_period_end')
    .eq('patient_id', userId)
    .maybeSingle();
  if (activationLookupError) return respond(reference, { error: 'ACTIVATION_STATUS_LOOKUP_FAILED' }, 500);
  if (activated && String(activated.status).toUpperCase() === 'ACTIVE' && activated.plan_id === planId) {
    return respond(reference, { status: 'active', plan_id: activated.plan_id, current_period_end: activated.current_period_end });
  }
  return respond(reference, { status: 'processing', webhook: webhookResult }, 202);
});
