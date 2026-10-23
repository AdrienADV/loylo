-- Invitation links only travel by email: opening one proves access to the
-- invited mailbox, so it signs the invitee in. The database keeps a SHA-256
-- hash of each token: admins can no longer read or copy a link, and a leaked
-- table does not leak working links.

-- Hashed tokens ----------------------------------------------------------------

alter table public.program_invitations add column token_hash text;

-- Pending invitations keep their links.
update public.program_invitations
set token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex');

alter table public.program_invitations
  alter column token_hash set not null,
  add constraint program_invitations_token_hash_key unique (token_hash),
  add constraint program_invitations_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$'),
  drop column token;

comment on column public.program_invitations.token_hash is 'SHA-256 of the invitation link''s token (hex). The token itself is only in the email.';

-- Admins list invitations without their hash.
revoke select on table public.program_invitations from authenticated;
grant select (id, program_id, email, role, invited_by, created_at, expires_at)
  on table public.program_invitations to authenticated;

-- Functions ----------------------------------------------------------------------

-- The returned row changes: it now carries the token, which is not stored.
drop function public.create_program_invitation(uuid, extensions.citext, uuid);

-- Invites `email` to the program's team as a member, or renews its pending
-- invitation (new link, new expiry, the previous link stops working). Returns
-- the link's token, to email it; only its hash is stored. Raises `LY003`
-- (already in the team) or `LY004` (too many pending invitations); returns no
-- row for an unknown program. Expired invitations of the program are removed
-- on the way.
--
-- Server only: team emails live in `auth.users`. The server checks that the
-- caller is an admin of the program before calling it.
create function public.create_program_invitation(
  program_id uuid,
  email extensions.citext,
  invited_by uuid
)
returns table (invitation_id uuid, token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  new_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  -- Concurrent invitations to the program wait here, then see this one.
  perform 1 from public.programs
  where programs.id = create_program_invitation.program_id
  for no key update;
  if not found then
    return;
  end if;

  if exists (
    select 1
    from public.program_members
    join auth.users on users.id = program_members.user_id
    where program_members.program_id = create_program_invitation.program_id
      and lower(users.email) = lower(create_program_invitation.email::text)
  ) then
    raise exception 'This person is already in the team' using errcode = 'LY003';
  end if;

  delete from public.program_invitations
  where program_invitations.program_id = create_program_invitation.program_id
    and program_invitations.expires_at <= now();

  if (
    select count(*) from public.program_invitations
    where program_invitations.program_id = create_program_invitation.program_id
      and not program_invitations.email operator(extensions.=) create_program_invitation.email
  ) >= 20 then
    raise exception 'Too many pending invitations' using errcode = 'LY004';
  end if;

  return query
    insert into public.program_invitations (program_id, email, invited_by, token_hash)
    values (
      create_program_invitation.program_id,
      create_program_invitation.email,
      create_program_invitation.invited_by,
      encode(sha256(convert_to(new_token, 'UTF8')), 'hex')
    )
    on conflict on constraint program_invitations_program_id_email_key do update
      set token_hash = excluded.token_hash,
        invited_by = excluded.invited_by,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at
    returning program_invitations.id, new_token, program_invitations.expires_at;
end;
$$;

-- What the invitation page shows: the program and the invited email, for a
-- pending invitation. Server only.
create function public.get_program_invitation(token text)
returns table (program_id uuid, program_name text, email extensions.citext)
language sql
stable
security definer
set search_path = ''
as $$
  select programs.id, programs.name, invitations.email
  from public.program_invitations as invitations
  join public.programs on programs.id = invitations.program_id
  where invitations.token_hash = encode(sha256(convert_to(get_program_invitation.token, 'UTF8')), 'hex')
    and invitations.expires_at > now();
$$;

-- Adds the user to the team of the invitation, which must be theirs: their
-- confirmed email is the invited one. Removes the invitation and returns its
-- program. Raises `LY005` (unknown or expired invitation) or `LY006` (another
-- email's invitation).
--
-- Server only: the server passes the user it signed in with the invitation.
create or replace function public.accept_program_invitation(token text, user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  invitation public.program_invitations;
  user_email text;
begin
  select * into invitation
  from public.program_invitations
  where program_invitations.token_hash = encode(sha256(convert_to(accept_program_invitation.token, 'UTF8')), 'hex')
  for update;
  if not found or invitation.expires_at <= now() then
    raise exception 'The invitation is unknown or has expired' using errcode = 'LY005';
  end if;

  select users.email into user_email
  from auth.users
  where users.id = accept_program_invitation.user_id
    and users.email_confirmed_at is not null;
  if user_email is null or lower(user_email) <> lower(invitation.email::text) then
    raise exception 'The invitation is for another email' using errcode = 'LY006';
  end if;

  insert into public.program_members (program_id, user_id, role)
  values (invitation.program_id, accept_program_invitation.user_id, invitation.role)
  on conflict do nothing;

  delete from public.program_invitations
  where program_invitations.id = invitation.id;

  return invitation.program_id;
end;
$$;

-- Invitations are no longer listed to the invitee: their link is only in the
-- email. Nothing looks invitations up by email alone anymore.
drop function public.list_user_invitations(uuid);
drop index public.program_invitations_email_idx;

revoke execute on function public.create_program_invitation from public, anon, authenticated;
revoke execute on function public.get_program_invitation from public, anon, authenticated;
grant execute on function public.create_program_invitation to service_role;
grant execute on function public.get_program_invitation to service_role;
