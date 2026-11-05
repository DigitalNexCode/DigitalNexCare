import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-digitalnexcare-client, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-client-version, traceparent, tracestate, baggage',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

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
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !paystackSecret) return json({ error: 'Payment service is not configured' }, 503);

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Authentication required' }, 401);
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: 'Authentication required' }, 401);

  const body = await request.json().catch(() => null) as { planId?: string } | null;
  const planId = body?.planId;
  if (!planId) return json({ error: 'planId is required' }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: plan, error: planError } = await admin.from('patient_subscription_plans').select('id, name, price_cents').eq('id', planId).maybeSingle();
  if (planError || !plan) return json({ error: 'Unknown subscription plan' }, 400);
  if (plan.price_cents <= 0) return json({ error: 'Free plans do not require Paystack' }, 400);

  const reference = `DNX_PSTK_${crypto.randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`;
  const { error: paymentError } = await admin.from('payments').insert({
    payment_reference: reference,
    user_id: user.id,
    gateway: 'PAYSTACK',
    amount_cents: plan.price_cents,
    currency: 'ZAR',
    status: 'INITIALIZED',
    raw_response: { plan_id: plan.id, plan_name: plan.name },
  });
  if (paymentError) return json({ error: 'Unable to create payment record' }, 500);

  const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${paystackSecret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      amount: plan.price_cents,
      currency: 'ZAR',
      reference,
      callback_url: `${supabaseUrl.replace(/\/$/, '')}/functions/v1/paystack-confirm-patient-subscription`,
      metadata: { user_id: user.id, plan_id: plan.id, internal_reference: reference },
    }),
  });
  const result = await paystackResponse.json().catch(() => null);
  if (!paystackResponse.ok || !result?.status || !result?.data?.authorization_url) {
    await admin.from('payments').update({ status: 'FAILED', raw_response: result }).eq('payment_reference', reference);
    return json({ error: result?.message || 'Paystack initialization failed' }, 502);
  }
  await admin.from('payments').update({ gateway_transaction_id: result.data.reference, status: 'PROCESSING', raw_response: { plan_id: plan.id, plan_name: plan.name, paystack_initialization: result } }).eq('payment_reference', reference);
  return json({ authorization_url: result.data.authorization_url, reference, amount_cents: plan.price_cents });
});
