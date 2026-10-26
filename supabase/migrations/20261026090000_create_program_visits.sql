-- Visits of a program hour by hour, for the chart of the overview.

-- Point additions and stamps (the visits counted by `program_stats`) of the
-- last `days` days, per UTC hour; hours without visits are left out. Hours,
-- not days: the browser groups them into days of the merchant's time zone,
-- which the server does not know. Security invoker: RLS counts nothing for a
-- foreign or unknown program.
create function public.program_visits(program_id uuid, days integer default 31)
returns table (hour timestamptz, visits bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with enrolled as (
    select members.id
    from public.members
    where members.program_id = program_visits.program_id
  ),
  since as (
    select now() - make_interval(days => least(greatest(program_visits.days, 1), 366)) as at
  ),
  visits as (
    select point_transactions.created_at
    from public.point_transactions
    join enrolled on enrolled.id = point_transactions.member_id, since
    where point_transactions.kind = 'adjustment'
      and point_transactions.delta > 0
      and point_transactions.created_at >= since.at
    union all
    select stamp_transactions.created_at
    from public.stamp_transactions
    join enrolled on enrolled.id = stamp_transactions.member_id, since
    where stamp_transactions.kind = 'stamp'
      and stamp_transactions.created_at >= since.at
  )
  select date_trunc('hour', visits.created_at, 'UTC'), count(*)
  from visits
  group by 1
  order by 1;
$$;

revoke execute on function public.program_visits from public, anon;
grant execute on function public.program_visits to authenticated, service_role;
