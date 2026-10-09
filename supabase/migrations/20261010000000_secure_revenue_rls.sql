-- Revenue and fulfillment records contain customer and payment data.
-- Keep access server-side through the Supabase service role until row ownership
-- is modeled explicitly; never grant every authenticated user access to all rows.
begin;

alter table public.customers enable row level security;
alter table public.revenue_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.fulfillment_jobs enable row level security;
alter table public.revenue_products enable row level security;

drop policy if exists "authenticated_full_access" on public.customers;
drop policy if exists "authenticated_full_access" on public.revenue_events;
drop policy if exists "authenticated_full_access" on public.subscriptions;
drop policy if exists "Authenticated users can read fulfillment jobs" on public.fulfillment_jobs;

-- The existing authenticated read policy on revenue_products is intentionally
-- preserved: it exposes catalog metadata only, not customer or payment records.

commit;
