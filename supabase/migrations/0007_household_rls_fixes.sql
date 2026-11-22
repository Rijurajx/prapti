-- 0007: helper functions so household membership checks and grant revocation work under RLS. Depends on 0005 and 0006. Never store Aadhaar or identity-document numbers.

-- 1. Is the signed-in user the creator of this household?
create or replace function public.is_household_creator(p_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.households h
    where h.id = p_household and h.created_by_user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_household_creator(uuid) from public, anon;
grant execute on function public.is_household_creator(uuid) to authenticated;

-- 2. Is this citizen an active member of this household?
create or replace function public.is_active_member_profile(p_household uuid, p_citizen uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = p_household
      and m.citizen_profile_id = p_citizen
      and m.status = 'active'
  );
$$;

revoke all on function public.is_active_member_profile(uuid, uuid) from public, anon;
grant execute on function public.is_active_member_profile(uuid, uuid) to authenticated;

-- 3. Does the signed-in user own this citizen profile?
create or replace function public.owns_citizen_profile(p_citizen uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.citizen_profiles cp
    where cp.id = p_citizen and cp.owner_user_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_citizen_profile(uuid) from public, anon;
grant execute on function public.owns_citizen_profile(uuid) to authenticated;

-- 4. Remove a member and revoke that citizen's open access grants in one step. Creator only.
create or replace function public.revoke_membership_grants(p_membership uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household uuid;
  v_citizen uuid;
  v_creator uuid;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select household_id, citizen_profile_id
    into v_household, v_citizen
    from public.household_members
    where id = p_membership;
  if not found then
    raise exception 'membership not found';
  end if;

  select created_by_user_id into v_creator
    from public.households
    where id = v_household;
  if v_creator is distinct from auth.uid() then
    raise exception 'not allowed';
  end if;

  update public.household_members
    set status = 'removed'
    where id = p_membership;

  update public.profile_access_grants
    set revoked_at = now()
    where citizen_profile_id = v_citizen
      and revoked_at is null;
  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

revoke all on function public.revoke_membership_grants(uuid) from public, anon;
grant execute on function public.revoke_membership_grants(uuid) to authenticated;
