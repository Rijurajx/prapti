-- Migration 0013: family members support in citizen_profiles
-- Drops the constraint restricting relationship_to_owner to 'self', allowing family relations like Father, Mother, Aunt, Child, Spouse, or any custom text.

alter table public.citizen_profiles
  drop constraint if exists citizen_profiles_relationship_to_owner_check;

alter table public.citizen_profiles
  add constraint citizen_profiles_relationship_to_owner_check
  check (char_length(relationship_to_owner) between 1 and 80);

-- Allow owner to delete family member profiles (except their primary 'self' profile)
drop policy if exists "citizen_profiles_delete_own" on public.citizen_profiles;
create policy "citizen_profiles_delete_own"
  on public.citizen_profiles for delete
  to authenticated
  using (auth.uid() = owner_user_id and relationship_to_owner <> 'self');
