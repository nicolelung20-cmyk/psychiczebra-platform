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

create table public.consultation_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  work_email text not null check (char_length(work_email) between 3 and 254),
  company text not null check (char_length(company) between 1 and 160),
  role text not null check (char_length(role) between 1 and 120),
  team_size text not null check (char_length(team_size) between 1 and 80),
  primary_goal text not null check (char_length(primary_goal) between 1 and 1000),
  budget_range text not null check (char_length(budget_range) between 1 and 80),
  timeline text not null check (char_length(timeline) between 1 and 80),
  created_at timestamptz not null default now()
);

create index consultation_leads_created_at_idx
  on public.consultation_leads (created_at desc);

alter table public.consultation_leads enable row level security;

revoke all on table public.consultation_leads from anon, authenticated;
