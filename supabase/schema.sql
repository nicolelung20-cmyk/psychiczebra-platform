create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  usage_count integer not null default 0 check (usage_count >= 0),
  usage_period_started_at timestamptz not null default now(),
  stripe_subscription_id text unique
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated using ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.consume_message()
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  permitted boolean;
begin
  update public.profiles
  set
    usage_count = case
      when usage_period_started_at <= now() - interval '1 month' then 1
      else usage_count + 1
    end,
    usage_period_started_at = case
      when usage_period_started_at <= now() - interval '1 month' then now()
      else usage_period_started_at
    end
  where id = auth.uid()
    and (
      usage_period_started_at <= now() - interval '1 month'
      or
      (plan = 'free' and usage_count < 20)
      or (plan = 'pro' and usage_count < 500)
    )
  returning true into permitted;
  return coalesce(permitted, false);
end;
$$;

revoke all on function public.consume_message() from public;
grant execute on function public.consume_message() to authenticated;

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  work_email text not null,
  role text not null,
  company text not null,
  team_size text not null,
  budget_range text not null,
  primary_goal text not null,
  timeline text not null
);

-- RLS is enabled with no policies: only the service-role key (used by
-- app/api/consultations/route.ts) can read or write this table. No one
-- authenticates as a normal user to submit or view leads.
alter table public.consultations enable row level security;
