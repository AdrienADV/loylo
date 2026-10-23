-- Program teams: the merchant who creates a program is its admin and invites
-- other people (staff) as members. Every team member manages the program's
-- customers, cards, points and messages; only admins change or delete the
-- program and manage the team.

create type public.program_role as enum ('admin', 'member');

-- Team members -----------------------------------------------------------------

create table public.program_members (
  program_id uuid not null references public.programs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.program_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (program_id, user_id)
);

comment on table public.program_members is 'People who manage a program. Its owner is always an admin of it.';

-- The primary key serves `program_id`; this one serves `user_id`.
create index program_members_user_id_idx on public.program_members (user_id);

-- Owners of existing programs become their admins.
insert into public.program_members (program_id, user_id, role)
select programs.id, programs.owner_id, 'admin'
from public.programs;

-- New programs get their owner as admin. Security definer: merchants cannot
-- add team members themselves, only accept invitations.
create function private.add_program_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.program_members (program_id, user_id, role)
  values (new.id, new.owner_id, 'admin');
  return null;
end;
$$;

create trigger programs_add_owner
  after insert on public.programs
  for each row execute function private.add_program_owner();

-- Access helpers ---------------------------------------------------------------

-- Programs of the signed-in user, for RLS policies. Security definer, so
-- policies on `program_members` do not recurse; `in (select ...)` evaluates
-- them once per statement.
create function private.member_program_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select program_members.program_id
  from public.program_members
  where program_members.user_id = (select auth.uid());
$$;

create function private.admin_program_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select program_members.program_id
  from public.program_members
  where program_members.user_id = (select auth.uid())
    and program_members.role = 'admin';
$$;

-- Policies call them as the signed-in user; the `private` schema itself stays
-- out of reach.
revoke all on function private.member_program_ids from public;
revoke all on function private.admin_program_ids from public;
grant execute on function private.member_program_ids to authenticated;
grant execute on function private.admin_program_ids to authenticated;

-- Team members leave or are removed; joining goes through invitations.
revoke all on table public.program_members from anon, authenticated;
grant select, delete on table public.program_members to authenticated;
grant select, insert, update, delete on table public.program_members to service_role;

alter table public.program_members enable row level security;

create policy "Team members can read their teams"
  on public.program_members for select
  to authenticated
  using (program_id in (select private.member_program_ids()));

-- Admins remove people, anyone leaves; the owner always stays.
create policy "Admins remove team members and members leave"
  on public.program_members for delete
  to authenticated
  using (
    (
      program_id in (select private.admin_program_ids())
      or user_id = (select auth.uid())
    )
    and user_id <> (
      select programs.owner_id from public.programs
      where programs.id = program_members.program_id
    )
  );

-- Programs and their data: from owner to team -------------------------------------

-- The owner check stays: a program's RETURNING row is read before the trigger
-- above adds its owner to the team.
drop policy "Merchants can read their programs" on public.programs;
create policy "Team members can read their programs"
  on public.programs for select
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or id in (select private.member_program_ids())
  );

drop policy "Merchants can update their programs" on public.programs;
create policy "Admins can update their programs"
  on public.programs for update
  to authenticated
  using (id in (select private.admin_program_ids()))
  with check (id in (select private.admin_program_ids()));

drop policy "Merchants can delete their programs" on public.programs;
create policy "Admins can delete their programs"
  on public.programs for delete
  to authenticated
  using (id in (select private.admin_program_ids()));

drop policy "Merchants can read their members" on public.members;
create policy "Team members can read their members"
  on public.members for select
  to authenticated
  using (program_id in (select private.member_program_ids()));

drop policy "Merchants can add members to their programs" on public.members;
create policy "Team members can add members to their programs"
  on public.members for insert
  to authenticated
  with check (program_id in (select private.member_program_ids()));

drop policy "Merchants can update their members" on public.members;
create policy "Team members can update their members"
  on public.members for update
  to authenticated
  using (program_id in (select private.member_program_ids()))
  with check (program_id in (select private.member_program_ids()));

drop policy "Merchants can read their members' passes" on public.wallet_passes;
create policy "Team members can read their members' passes"
  on public.wallet_passes for select
  to authenticated
  using (
    member_id in (
      select members.id from public.members
      where members.program_id in (select private.member_program_ids())
    )
  );

drop policy "Merchants can issue passes to their members" on public.wallet_passes;
create policy "Team members can issue passes to their members"
  on public.wallet_passes for insert
  to authenticated
  with check (
    member_id in (
      select members.id from public.members
      where members.program_id in (select private.member_program_ids())
    )
  );

drop policy "Merchants can read their members' point transactions" on public.point_transactions;
create policy "Team members can read their members' point transactions"
  on public.point_transactions for select
  to authenticated
  using (
    member_id in (
      select members.id from public.members
      where members.program_id in (select private.member_program_ids())
    )
  );

drop policy "Merchants can read their programs' notifications" on public.notifications;
create policy "Team members can read their programs' notifications"
  on public.notifications for select
  to authenticated
  using (program_id in (select private.member_program_ids()));

-- Invitations --------------------------------------------------------------------

-- Pending invitations to join a team. The invitation link carries the token;
-- only the account with the invited email can accept it.
create table public.program_invitations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  email extensions.citext not null check (
    char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+$'
  ),
  role public.program_role not null default 'member',
  -- Secret of the invitation link: 256 random bits.
  token text not null unique
    default encode(extensions.gen_random_bytes(32), 'hex')
    check (token ~ '^[0-9a-f]{64}$'),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  constraint program_invitations_program_id_email_key unique (program_id, email)
);

comment on table public.program_invitations is 'Pending invitations to join a program''s team. Written by create_program_invitation, removed once accepted.';

-- The unique constraint's index also serves the `program_id` foreign key.
create index program_invitations_email_idx on public.program_invitations (email);
create index program_invitations_invited_by_idx on public.program_invitations (invited_by);

-- Admins see and cancel their invitations; creating and accepting them goes
-- through the functions below, on the server.
revoke all on table public.program_invitations from anon, authenticated;
grant select, delete on table public.program_invitations to authenticated;
grant select, insert, update, delete on table public.program_invitations to service_role;

alter table public.program_invitations enable row level security;

create policy "Admins can read their programs' invitations"
  on public.program_invitations for select
  to authenticated
  using (program_id in (select private.admin_program_ids()));

create policy "Admins can cancel their programs' invitations"
  on public.program_invitations for delete
  to authenticated
  using (program_id in (select private.admin_program_ids()));

-- Invites `email` to the program's team as a member, or renews its pending
-- invitation (new link, new expiry). Raises `LY003` (already in the team) or
-- `LY004` (too many pending invitations); returns no row for an unknown
-- program. Expired invitations of the program are removed on the way.
--
-- Server only: team emails live in `auth.users`. The server checks that the
-- caller is an admin of the program before calling it.
create function public.create_program_invitation(
  program_id uuid,
  email extensions.citext,
  invited_by uuid
)
returns setof public.program_invitations
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
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
    insert into public.program_invitations (program_id, email, invited_by)
    values (
      create_program_invitation.program_id,
      create_program_invitation.email,
      create_program_invitation.invited_by
    )
    on conflict on constraint program_invitations_program_id_email_key do update
      set token = excluded.token,
        invited_by = excluded.invited_by,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at
    returning *;
end;
$$;

-- Adds the user to the team of the invitation, which must be theirs: their
-- confirmed email is the invited one. Removes the invitation and returns its
-- program. Raises `LY005` (unknown or expired invitation) or `LY006` (another
-- email's invitation).
--
-- Server only: the server passes the signed-in user it verified.
create function public.accept_program_invitation(token text, user_id uuid)
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
  where program_invitations.token = accept_program_invitation.token
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

-- The program's team with their emails, admins first. Server only: the
-- server checks that the caller is in the team before calling it.
create function public.list_program_team(program_id uuid)
returns table (user_id uuid, email text, role public.program_role, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select program_members.user_id, users.email::text, program_members.role, program_members.created_at
  from public.program_members
  join auth.users on users.id = program_members.user_id
  where program_members.program_id = list_program_team.program_id
  order by program_members.role, program_members.created_at;
$$;

-- Pending invitations sent to the user's confirmed email, newest first, so
-- people who just signed up find them. Server only.
create function public.list_user_invitations(user_id uuid)
returns table (token text, program_name text, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select invitations.token, programs.name, invitations.expires_at
  from auth.users
  join public.program_invitations as invitations
    on invitations.email operator(extensions.=) users.email::extensions.citext
  join public.programs on programs.id = invitations.program_id
  where users.id = list_user_invitations.user_id
    and users.email_confirmed_at is not null
    and invitations.expires_at > now()
  order by invitations.created_at desc;
$$;

revoke execute on function public.create_program_invitation from public, anon, authenticated;
revoke execute on function public.accept_program_invitation from public, anon, authenticated;
revoke execute on function public.list_program_team from public, anon, authenticated;
revoke execute on function public.list_user_invitations from public, anon, authenticated;
grant execute on function public.create_program_invitation to service_role;
grant execute on function public.accept_program_invitation to service_role;
grant execute on function public.list_program_team to service_role;
grant execute on function public.list_user_invitations to service_role;
