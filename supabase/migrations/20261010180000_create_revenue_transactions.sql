-- The billing webhook and verified kit-delivery route write this ledger.
-- Keep it server-only: both routes use the Supabase service-role client.
create table if not exists public.revenue_transactions (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  email text,
  product text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  status text not null default 'paid' check (status in ('paid', 'delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenue_transactions enable row level security;

revoke all privileges on table public.revenue_transactions from anon, authenticated;
grant all privileges on table public.revenue_transactions to service_role;

drop policy if exists server_only_deny_client_access on public.revenue_transactions;
create policy server_only_deny_client_access
  on public.revenue_transactions
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
