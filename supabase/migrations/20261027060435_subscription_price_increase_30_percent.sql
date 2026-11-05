-- Apply once, separately from the reseller schema and coordinated with checkout pricing.
begin;
update public.patient_subscription_plans set price_cents = round(price_cents::numeric * 1.30)::integer where price_cents > 0;
update public.commercial_products set price_cents = round(price_cents::numeric * 1.30)::integer where price_cents > 0 and target_audience in ('PRACTICE','PROVIDER');
commit;
