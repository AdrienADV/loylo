-- Headline numbers of a program, shown above its members list.

-- Members, how many keep the card in a wallet, and the last 30 days'
-- activity: new members, point additions (visits) and redemptions. Security
-- invoker: RLS counts nothing for a foreign or unknown program.
create function public.program_stats(program_id uuid)
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
  activity as (
    select
      count(*) filter (where point_transactions.delta > 0) as point_additions,
      count(*) filter (where point_transactions.delta < 0) as redemptions
    from public.point_transactions
    join enrolled on enrolled.id = point_transactions.member_id
    where point_transactions.kind = 'adjustment'
      and point_transactions.created_at >= now() - interval '30 days'
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
    activity.point_additions,
    activity.redemptions
  from activity;
$$;

revoke execute on function public.program_stats from public, anon;
grant execute on function public.program_stats to authenticated, service_role;
