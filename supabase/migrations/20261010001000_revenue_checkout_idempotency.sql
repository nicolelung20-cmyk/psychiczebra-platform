-- Enforce one fulfillment job and one one-time revenue record per checkout session,
-- even when Stripe retries or delivers two success event types concurrently.
begin;

create unique index if not exists revenue_events_checkout_session_id_key
  on public.revenue_events ((metadata->>'checkout_session_id'))
  where event_type = 'checkout_completed' and metadata ? 'checkout_session_id';

create unique index if not exists fulfillment_jobs_checkout_session_product_key
  on public.fulfillment_jobs ((metadata->>'checkout_session_id'), product_id)
  where metadata ? 'checkout_session_id' and product_id is not null;

commit;
