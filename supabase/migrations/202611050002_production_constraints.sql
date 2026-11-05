begin;
-- Forward-only hardening. The original migration remains unchanged.
alter table public.runs add constraint runs_payload_shape check (
  payload ?& array['id','name','adapter','results','datasetHash','evaluatorVersion','createdAt']
  and jsonb_typeof(payload->'results') = 'array'
  and jsonb_array_length(payload->'results') between 1 and 500
  and octet_length(payload::text) <= 2097152
);
-- Owner storage is bounded even for direct PostgREST calls, not only application APIs.
create function public.enforce_run_storage_limit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text, 1));
  if (select count(*) from public.runs where owner_id = new.owner_id) >= 50 then
    raise exception 'Workspace run limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_run_storage_limit() from public, anon, authenticated;
create trigger enforce_run_storage_limit before insert on public.runs
for each row execute function public.enforce_run_storage_limit();

create function public.validate_review_case() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from public.runs r, jsonb_array_elements(r.payload->'results') result
    where r.id = new.run_id and r.owner_id = new.owner_id
      and result->>'caseId' = new.case_id and not result ? 'error'
  ) then raise exception 'Case not present in owned evaluated run' using errcode = '23514'; end if;
  new.created_at := now();
  return new;
end;
$$;
revoke all on function public.validate_review_case() from public, anon, authenticated;
create trigger validate_review_case before insert or update on public.reviews
for each row execute function public.validate_review_case();
commit;
