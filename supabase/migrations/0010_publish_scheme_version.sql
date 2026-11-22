-- 0010: publish a scheme version atomically. Depends on 0009. Never store Aadhaar or identity-document numbers.

-- Publish one scheme version in a single transaction: checks, retire the previous published version, publish this one, point the scheme at it.
-- All writes happen in one transaction, so a failure leaves the previous published version in place.
create or replace function public.publish_scheme_version(p_version_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
  n_sources integer;
  n_unverified integer;
  n_rules integer;
begin
  -- 1. Administrators only; the check runs inside the function, not in the caller.
  if not public.is_administrator() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  -- 2. Lock the version row so a concurrent publish or edit waits.
  select id, scheme_id, status into v
  from public.scheme_versions
  where id = p_version_id
  for update;
  if not found then
    raise exception 'version not found';
  end if;

  -- 3. Only a version in review can be published.
  if v.status <> 'in_review' then
    raise exception 'Only a version in review can be published' using errcode = 'check_violation';
  end if;

  -- 4. Gate: at least one source, every source verified, at least one rule.
  select count(*) into n_sources
  from public.scheme_sources
  where scheme_version_id = p_version_id;

  select count(*) into n_unverified
  from public.scheme_sources
  where scheme_version_id = p_version_id
    and verified_at is null;

  select count(*) into n_rules
  from public.scheme_rules
  where scheme_version_id = p_version_id;

  if n_sources = 0 then
    raise exception 'Attach at least one source' using errcode = 'check_violation';
  end if;
  if n_unverified > 0 then
    raise exception 'Every source must be verified before publication' using errcode = 'check_violation';
  end if;
  if n_rules = 0 then
    raise exception 'Add at least one rule' using errcode = 'check_violation';
  end if;

  -- 5. Retire the previously published version (the immutability trigger allows published -> retired only).
  update public.scheme_versions
  set status = 'retired'
  where scheme_id = v.scheme_id
    and status = 'published'
    and id <> p_version_id;

  -- 6. Publish this version.
  update public.scheme_versions
  set status = 'published', published_at = now()
  where id = p_version_id;

  -- 7. Point the scheme at the published version.
  update public.schemes
  set status = 'published', current_version_id = p_version_id
  where id = v.scheme_id;
end;
$$;

revoke all on function public.publish_scheme_version(uuid) from public, anon;
grant execute on function public.publish_scheme_version(uuid) to authenticated;
