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
