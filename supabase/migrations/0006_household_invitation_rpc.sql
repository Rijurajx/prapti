-- 0006: invitee-side accept and decline for household invitations. Depends on 0005_household.sql. Never store Aadhaar or identity-document numbers.

-- These two functions are the only path by which an invitee can touch a household_invitations row.
-- They only ever change household membership and the invitation status; they never grant profile access.

create or replace function public.accept_household_invitation(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  own_citizen_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select id, household_id
    into inv
    from household_invitations
   where token_hash = p_token_hash
     and status = 'pending'
     and expires_at > now()
   for update;

  if not found then
    raise exception 'invitation not usable';
  end if;

  select id
    into own_citizen_id
    from citizen_profiles
   where owner_user_id = auth.uid()
     and relationship_to_owner = 'self'
   limit 1;

  if own_citizen_id is null then
    raise exception 'profile not found';
  end if;

  insert into household_members (household_id, citizen_profile_id, relationship, status)
  values (inv.household_id, own_citizen_id, 'other', 'active')
  on conflict (household_id, citizen_profile_id) do update set status = 'active';

  -- Records the membership consent. No profile_access_grants row is created here.
  insert into consent_records (citizen_profile_id, grantee_user_id, scope, consent_text_version)
  values (own_citizen_id, null, 'household_membership', 'v1');

  update household_invitations
     set status = 'accepted'
   where id = inv.id;

  return inv.household_id;
end;
$$;

create or replace function public.decline_household_invitation(p_token_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  update household_invitations
     set status = 'declined'
   where token_hash = p_token_hash
     and status = 'pending'
     and expires_at > now();

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    raise exception 'invitation not usable';
  end if;
end;
$$;

revoke all on function public.accept_household_invitation(text) from public, anon;
grant execute on function public.accept_household_invitation(text) to authenticated;

revoke all on function public.decline_household_invitation(text) from public, anon;
grant execute on function public.decline_household_invitation(text) to authenticated;
