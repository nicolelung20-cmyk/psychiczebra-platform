-- Revenue Command Center foundation for Elevated AI.
-- Safe to apply after the existing supabase/schema.sql baseline.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'revenue_pipeline_stage') then
    create type public.revenue_pipeline_stage as enum (
      'new', 'qualified', 'discovery', 'proposal', 'negotiation', 'won', 'lost'
    );
  end if;
end $$;

create table if not exists public.revenue_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  website text,
  industry text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_leads (
  id uuid primary key default gen_random_uuid(),
  consultation_lead_id uuid unique references public.consultation_leads(id) on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  work_email text not null check (char_length(work_email) between 3 and 254),
  company text not null check (char_length(company) between 1 and 160),
  role text,
  source text,
  status public.revenue_pipeline_stage not null default 'new',
  score integer check (score is null or score between 0 and 100),
  estimated_value numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  owner_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_opportunities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.revenue_leads(id) on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  stage public.revenue_pipeline_stage not null default 'qualified',
  amount numeric(12,2) not null default 0 check (amount >= 0),
  probability numeric(5,2) not null default 20 check (probability between 0 and 100),
  expected_close_date date,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_deals (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid unique references public.revenue_opportunities(id) on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  status text not null default 'open' check (status in ('open', 'won', 'lost', 'cancelled')),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  closed_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.revenue_leads(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete cascade,
  deal_id uuid references public.revenue_deals(id) on delete cascade,
  activity_type text not null check (activity_type in ('note','email','call','meeting','task','stage_change')),
  subject text not null check (char_length(subject) between 1 and 240),
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(lead_id, opportunity_id, deal_id) = 1)
);

create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.revenue_deals(id) on delete set null,
  event_type text not null check (event_type in ('checkout_completed','subscription_started','subscription_updated','subscription_cancelled','payment_succeeded','payment_failed','refund')),
  external_id text,
  amount numeric(12,2) check (amount is null or amount >= 0),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (event_type, external_id)
);

create index if not exists revenue_leads_status_idx on public.revenue_leads(status);
create index if not exists revenue_leads_owner_idx on public.revenue_leads(owner_id);
create index if not exists revenue_leads_created_at_idx on public.revenue_leads(created_at desc);
create index if not exists revenue_opportunities_stage_idx on public.revenue_opportunities(stage);
create index if not exists revenue_opportunities_close_idx on public.revenue_opportunities(expected_close_date);
create index if not exists revenue_deals_status_idx on public.revenue_deals(status);
create index if not exists revenue_events_occurred_at_idx on public.revenue_events(occurred_at desc);
create index if not exists revenue_events_external_id_idx on public.revenue_events(external_id);

-- Keep updated_at deterministic without relying on application code.
create or replace function public.set_revenue_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists revenue_accounts_updated_at on public.revenue_accounts;
create trigger revenue_accounts_updated_at before update on public.revenue_accounts
for each row execute function public.set_revenue_updated_at();

drop trigger if exists revenue_leads_updated_at on public.revenue_leads;
create trigger revenue_leads_updated_at before update on public.revenue_leads
for each row execute function public.set_revenue_updated_at();

drop trigger if exists revenue_opportunities_updated_at on public.revenue_opportunities;
create trigger revenue_opportunities_updated_at before update on public.revenue_opportunities
for each row execute function public.set_revenue_updated_at();

drop trigger if exists revenue_deals_updated_at on public.revenue_deals;
create trigger revenue_deals_updated_at before update on public.revenue_deals
for each row execute function public.set_revenue_updated_at();

-- RLS: users can see/manage records they own. Service-role integrations remain able
-- to ingest Stripe events and consultation leads without weakening browser access.

do $$
declare
  t text;
begin
  foreach t in array array['revenue_accounts','revenue_leads','revenue_opportunities','revenue_deals','revenue_activities','revenue_events'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "Revenue owners can read accounts" on public.revenue_accounts
for select to authenticated using (owner_id = (select auth.uid()) or owner_id is null);
create policy "Revenue owners can insert accounts" on public.revenue_accounts
for insert to authenticated with check (owner_id = (select auth.uid()) or owner_id is null);
create policy "Revenue owners can update accounts" on public.revenue_accounts
for update to authenticated using (owner_id = (select auth.uid()) or owner_id is null)
with check (owner_id = (select auth.uid()) or owner_id is null);

create policy "Revenue owners can read leads" on public.revenue_leads
for select to authenticated using (owner_id = (select auth.uid()) or owner_id is null);
create policy "Revenue owners can insert leads" on public.revenue_leads
for insert to authenticated with check (owner_id = (select auth.uid()) or owner_id is null);
create policy "Revenue owners can update leads" on public.revenue_leads
for update to authenticated using (owner_id = (select auth.uid()) or owner_id is null)
with check (owner_id = (select auth.uid()) or owner_id is null);

create policy "Revenue owners can read opportunities" on public.revenue_opportunities
for select to authenticated using (owner_id = (select auth.uid()) or owner_id is null);
create policy "Revenue owners can insert opportunities" on public.revenue_opportunities
for insert to authenticated with check (owner_id = (select auth.uid()) or owner_id is null);
create policy "Revenue owners can update opportunities" on public.revenue_opportunities
for update to authenticated using (owner_id = (select auth.uid()) or owner_id is null)
with check (owner_id = (select auth.uid()) or owner_id is null);

create policy "Revenue owners can read deals" on public.revenue_deals
for select to authenticated using (owner_id = (select auth.uid()) or owner_id is null);
create policy "Revenue owners can insert deals" on public.revenue_deals
for insert to authenticated with check (owner_id = (select auth.uid()) or owner_id is null);
create policy "Revenue owners can update deals" on public.revenue_deals
for update to authenticated using (owner_id = (select auth.uid()) or owner_id is null)
with check (owner_id = (select auth.uid()) or owner_id is null);

create policy "Revenue owners can read activities" on public.revenue_activities
for select to authenticated using (created_by = (select auth.uid()) or created_by is null);
create policy "Revenue owners can insert activities" on public.revenue_activities
for insert to authenticated with check (created_by = (select auth.uid()) or created_by is null);
create policy "Revenue owners can update activities" on public.revenue_activities
for update to authenticated using (created_by = (select auth.uid()) or created_by is null)
with check (created_by = (select auth.uid()) or created_by is null);

create policy "Revenue owners can read events" on public.revenue_events
for select to authenticated using (
  deal_id is null or exists (
    select 1 from public.revenue_deals d
    where d.id = revenue_events.deal_id
      and (d.owner_id = (select auth.uid()) or d.owner_id is null)
  )
);

revoke all on public.revenue_accounts, public.revenue_leads, public.revenue_opportunities,
  public.revenue_deals, public.revenue_activities, public.revenue_events from anon;
