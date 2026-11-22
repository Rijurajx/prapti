-- 0008: break RLS recursion between households and household_members. Routes cross-table checks through SECURITY DEFINER helpers. Depends on 0005 and 0007. Never store Aadhaar or identity-document numbers.

-- 1. Helper: is the calling user the owner of an active member row in this household?
create or replace function public.is_household_member_owner(p_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    join public.citizen_profiles cp on cp.id = hm.citizen_profile_id
    where hm.household_id = p_household
      and hm.status = 'active'
      and cp.owner_user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_household_member_owner(uuid) from public, anon;
grant execute on function public.is_household_member_owner(uuid) to authenticated;

-- 2. households: select policy now calls the helper instead of querying household_members directly.
drop policy if exists "creator or active member can select households" on public.households;

create policy "creator or active member can select households"
  on public.households
  for select to authenticated
  using (
    created_by_user_id = (select auth.uid())
    or public.is_household_member_owner(id)
  );

-- 3. household_members: select policy uses the 0007 helpers instead of querying citizen_profiles and households.
drop policy if exists "owner or creator can select household members" on public.household_members;

create policy "owner or creator can select household members"
  on public.household_members
  for select to authenticated
  using (
    public.owns_citizen_profile(citizen_profile_id)
    or public.is_household_creator(household_id)
  );

-- 4. household_members: write policies (0005 names) now use is_household_creator instead of querying households.
drop policy if exists "creator can insert household members" on public.household_members;
drop policy if exists "creator can update household members" on public.household_members;
drop policy if exists "creator can delete household members" on public.household_members;

create policy "creator can insert household members"
  on public.household_members
  for insert to authenticated
  with check (public.is_household_creator(household_id));

create policy "creator can update household members"
  on public.household_members
  for update to authenticated
  using (public.is_household_creator(household_id))
  with check (public.is_household_creator(household_id));

create policy "creator can delete household members"
  on public.household_members
  for delete to authenticated
  using (public.is_household_creator(household_id));
