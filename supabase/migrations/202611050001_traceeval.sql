begin;
create table public.runs (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and payload ? 'results'),
  unique (id, owner_id),
  check ((payload->>'id')::uuid = id)
);
create index runs_owner_created on public.runs(owner_id, created_at desc);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  case_id text not null check (case_id ~ '^case-[0-9]{4}$'),
  source text not null default 'human' check (source = 'human'),
  score integer not null check (score between 0 and 2),
  rationale text not null check (length(trim(rationale)) between 10 and 2000),
  created_at timestamptz not null default now(),
  foreign key (run_id, owner_id) references public.runs(id, owner_id) on delete cascade,
  unique(run_id, case_id)
);
create index reviews_owner on public.reviews(owner_id);
alter table public.runs enable row level security;
alter table public.reviews enable row level security;
revoke all on public.runs, public.reviews from anon;
grant select, insert, delete on public.runs to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;
create policy runs_select on public.runs for select to authenticated using ((select auth.uid()) = owner_id);
create policy runs_insert on public.runs for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy runs_delete on public.runs for delete to authenticated using ((select auth.uid()) = owner_id);
create policy reviews_own on public.reviews for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- No client read/write grants or policies: only the quota function can access this table.
create table public.live_requests (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  case_count integer not null check (case_count between 1 and 10)
);
create index live_requests_owner_time on public.live_requests(owner_id, created_at);
alter table public.live_requests enable row level security;
revoke all on public.live_requests from anon, authenticated;
create function public.reserve_live_budget(p_count integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); daily integer; recent integer;
begin
  if caller is null or p_count is null or p_count < 1 or p_count > 10 then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  select coalesce(sum(case_count), 0), coalesce(sum(case_count) filter (where created_at > now() - interval '1 minute'), 0)
    into daily, recent from public.live_requests where owner_id = caller and created_at > now() - interval '24 hours';
  if daily + p_count > 100 or recent + p_count > 10 then return false; end if;
  insert into public.live_requests(owner_id, case_count) values (caller, p_count);
  return true;
end;
$$;
revoke all on function public.reserve_live_budget(integer) from public, anon;
grant execute on function public.reserve_live_budget(integer) to authenticated;
commit;
