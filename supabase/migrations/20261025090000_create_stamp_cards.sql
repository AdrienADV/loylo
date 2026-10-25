-- Stamp cards: a program either counts points or collects stamps on a card of
-- 10. A full card stays full until the next visit: its stamps then give the
-- reward, and the card starts over with that visit's stamps.

-- Programs ------------------------------------------------------------------------

create type public.program_kind as enum ('points', 'stamps');

alter table public.programs
  add column kind public.program_kind not null default 'points',
  -- Stamps granted to every new member. At most 9: a new card is never full.
  add column initial_stamps smallint not null default 0 check (initial_stamps between 0 and 9),
  -- What a full card gives, shown on the pass ("A free coffee").
  add column stamp_reward text check (
    char_length(stamp_reward) between 1 and 40 and btrim(stamp_reward) <> ''
  ),
  -- Key of the stamp icon in the app's catalog, to show the form again.
  add column stamp_icon text check (stamp_icon ~ '^[a-z][a-z0-9-]{0,31}$'),
  -- Folder of the card images, one per stamp count, in `program-assets`.
  add column stamp_images_path text check (char_length(stamp_images_path) between 1 and 512),
  -- Each kind has its own settings, and only them.
  add constraint programs_kind_settings_check check (
    case kind
      when 'points' then
        initial_stamps = 0 and stamp_reward is null and stamp_icon is null
        and stamp_images_path is null
      when 'stamps' then
        initial_points = 0 and stamp_reward is not null and stamp_icon is not null
        and stamp_images_path is not null
    end
  );

comment on column public.programs.kind is 'Points or stamps. Chosen when the program is created; members'' balances only make sense in one kind.';
comment on column public.programs.stamp_images_path is 'Folder of the stamp card images (0 to 10 stamps), generated in the browser. A new folder for every new design.';

-- The kind is set on insert only: no column grant to update it.
grant insert (kind, initial_stamps, stamp_reward, stamp_icon, stamp_images_path)
  on table public.programs to authenticated;
grant update (initial_stamps, stamp_reward, stamp_icon, stamp_images_path)
  on table public.programs to authenticated;

-- Members ---------------------------------------------------------------------------

alter table public.members
  -- Stamps on the member's current card, out of 10.
  add column stamps smallint not null default 0 check (stamps between 0 and 10),
  -- Full cards exchanged for the reward.
  add column stamp_rewards integer not null default 0 check (stamp_rewards >= 0);

-- New members start with the program's welcome points or stamps.
create or replace function private.set_member_initial_points()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select programs.initial_points, programs.initial_stamps
  into new.points, new.stamps
  from public.programs
  where programs.id = new.program_id;
  return new;
end;
$$;

-- Changed through `add_stamps`, which checks the program and the card.
grant update (stamps, stamp_rewards) on table public.members to authenticated;

-- Stamps ledger ----------------------------------------------------------------------

create type public.stamp_transaction_kind as enum ('welcome', 'stamp', 'reward', 'adjustment');

-- Append-only, like the points ledger: rows only come from the triggers below,
-- so the sum of a member's deltas is their stamps. `reward` rows empty a full
-- card (-10); `adjustment` rows remove stamps given by mistake.
create table public.stamp_transactions (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members (id) on delete cascade,
  kind public.stamp_transaction_kind not null,
  delta smallint not null check (delta between -10 and 10 and delta <> 0),
  balance_after smallint not null check (balance_after between 0 and 10),
  -- The team member who made the change; null for public enrollments.
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.stamp_transactions is 'Every change to a member''s stamps: welcome stamps, visits, rewards and corrections. Written by triggers on members.';

-- A member's history, newest first. Also serves the `member_id` foreign key.
create index stamp_transactions_member_id_id_idx on public.stamp_transactions (member_id, id);
create index stamp_transactions_created_by_idx on public.stamp_transactions (created_by);

-- Records a change of `members.stamps`. A reward (`stamp_rewards` + 1) empties
-- the full card first: the same update can then add the visit's stamps.
-- Security definer: team members cannot write to the ledger themselves.
create function private.record_stamp_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_stamps smallint := 0;
begin
  if tg_op = 'UPDATE' then
    previous_stamps := old.stamps;

    if new.stamp_rewards <> old.stamp_rewards then
      if new.stamp_rewards <> old.stamp_rewards + 1 or old.stamps <> 10 then
        raise exception 'A reward is given for a full card, one at a time'
          using errcode = 'LY005';
      end if;
      insert into public.stamp_transactions (member_id, kind, delta, balance_after, created_by)
      values (new.id, 'reward', -old.stamps, 0, auth.uid());
      previous_stamps := 0;
    end if;
  end if;

  if new.stamps <> previous_stamps then
    insert into public.stamp_transactions (member_id, kind, delta, balance_after, created_by)
    values (
      new.id,
      case
        when tg_op = 'INSERT' then 'welcome'
        when new.stamps > previous_stamps then 'stamp'
        else 'adjustment'
      end::public.stamp_transaction_kind,
      new.stamps - previous_stamps,
      new.stamps,
      auth.uid()
    );
  end if;
  return null;
end;
$$;

create trigger members_record_welcome_stamps
  after insert on public.members
  for each row when (new.stamps > 0)
  execute function private.record_stamp_transaction();

create trigger members_record_stamp_changes
  after update of stamps, stamp_rewards on public.members
  for each row when (
    new.stamps <> old.stamps or new.stamp_rewards <> old.stamp_rewards
  )
  execute function private.record_stamp_transaction();

revoke all on table public.stamp_transactions from anon, authenticated, service_role;
grant select on table public.stamp_transactions to authenticated, service_role;

alter table public.stamp_transactions enable row level security;

create policy "Team members can read their members' stamp transactions"
  on public.stamp_transactions for select
  to authenticated
  using (
    member_id in (
      select members.id from public.members
      where members.program_id in (select private.member_program_ids())
    )
  );

-- Changing stamps ----------------------------------------------------------------------

-- Adds `count` stamps (removes them when negative) in one transaction. On a
-- full card, added stamps first give the reward and start a new card. Raises
-- `LY003` for a points program and `LY004` when the stamps do not fit on the
-- card; a card below zero violates `members_stamps_check`. Returns no row for
-- an unknown or foreign member.
create function public.add_stamps(member_id uuid, count integer)
returns table (stamps smallint, reward_given boolean)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  card_size constant smallint := 10;
  current_stamps smallint;
  current_kind public.program_kind;
begin
  if add_stamps.count = 0 or abs(add_stamps.count) > card_size then
    raise exception 'count must be between -10 and 10, and not zero'
      using errcode = 'invalid_parameter_value';
  end if;

  -- Concurrent changes to the member wait here, then see this one.
  select members.stamps, programs.kind into current_stamps, current_kind
  from public.members
  join public.programs on programs.id = members.program_id
  where members.id = add_stamps.member_id
  for update of members;
  if not found then
    return;
  end if;
  if current_kind <> 'stamps' then
    raise exception 'This program does not use stamps' using errcode = 'LY003';
  end if;

  if add_stamps.count > 0 and current_stamps = card_size then
    return query
      update public.members
      set stamps = add_stamps.count, stamp_rewards = members.stamp_rewards + 1
      where members.id = add_stamps.member_id
      returning members.stamps, true;
    return;
  end if;

  if current_stamps + add_stamps.count > card_size then
    raise exception 'Only % stamps fit on the card', card_size - current_stamps
      using errcode = 'LY004';
  end if;

  return query
    update public.members
    set stamps = members.stamps + add_stamps.count
    where members.id = add_stamps.member_id
    returning members.stamps, false;
end;
$$;

revoke execute on function public.add_stamps from public, anon;
grant execute on function public.add_stamps to authenticated, service_role;

-- Points are for points programs only: same signature, one more check.
create or replace function public.adjust_points(member_id uuid, delta integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_points integer;
begin
  if adjust_points.delta = 0 then
    raise exception 'delta must not be zero' using errcode = 'invalid_parameter_value';
  end if;

  perform 1
  from public.members
  join public.programs on programs.id = members.program_id
  where members.id = adjust_points.member_id
    and programs.kind = 'stamps';
  if found then
    raise exception 'This program does not use points' using errcode = 'LY003';
  end if;

  update public.members
  set points = members.points + adjust_points.delta
  where members.id = adjust_points.member_id
  returning members.points into new_points;

  return new_points;
end;
$$;

-- Statistics ------------------------------------------------------------------------

-- Same columns for both kinds: in a stamps program, `point_additions` counts
-- visits that added stamps and `redemptions` the rewards given.
create or replace function public.program_stats(program_id uuid)
returns table (
  members bigint,
  new_members bigint,
  members_in_wallet bigint,
  point_additions bigint,
  redemptions bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with enrolled as (
    select members.id, members.created_at
    from public.members
    where members.program_id = program_stats.program_id
  ),
  point_activity as (
    select
      count(*) filter (where point_transactions.delta > 0) as additions,
      count(*) filter (where point_transactions.delta < 0) as redemptions
    from public.point_transactions
    join enrolled on enrolled.id = point_transactions.member_id
    where point_transactions.kind = 'adjustment'
      and point_transactions.created_at >= now() - interval '30 days'
  ),
  stamp_activity as (
    select
      count(*) filter (where stamp_transactions.kind = 'stamp') as additions,
      count(*) filter (where stamp_transactions.kind = 'reward') as redemptions
    from public.stamp_transactions
    join enrolled on enrolled.id = stamp_transactions.member_id
    where stamp_transactions.kind in ('stamp', 'reward')
      and stamp_transactions.created_at >= now() - interval '30 days'
  )
  select
    (select count(*) from enrolled),
    (select count(*) from enrolled where enrolled.created_at >= now() - interval '30 days'),
    (
      select count(*) from enrolled
      where exists (
        select 1 from public.wallet_passes
        where wallet_passes.member_id = enrolled.id
          and wallet_passes.installed_at is not null
          and wallet_passes.uninstalled_at is null
      )
    ),
    point_activity.additions + stamp_activity.additions,
    point_activity.redemptions + stamp_activity.redemptions
  from point_activity, stamp_activity;
$$;
