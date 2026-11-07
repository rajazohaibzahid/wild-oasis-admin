-- REVIEW REQUIRED: never apply to hosted Supabase without owner approval.
-- Targets the new Escapes foundation only; no customer booking contract is replaced.
begin;

-- A minimum stay longer than the booking horizon would prevent every new reservation.
alter table public.settings add constraint settings_minimum_within_horizon
  check (min_booking_length <= max_advance_days);

create table private.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  actor_id uuid not null,
  action text not null check (action in ('check_in','check_out','cancel','record_payment')),
  previous_status text not null,
  new_status text not null,
  amount numeric(12,2),
  reason text check (char_length(reason) between 5 and 500),
  created_at timestamptz not null default now()
);
create index booking_events_booking_idx on private.booking_events(booking_id, created_at);
create index booking_events_created_idx on private.booking_events(created_at);
alter table private.booking_events enable row level security;
revoke all on private.booking_events from public, anon, authenticated;

create function public.staff_access() returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.is_staff();
$$;
revoke all on function public.staff_access() from public, anon;
grant execute on function public.staff_access() to authenticated;

-- Browser roles retain NO direct booking write grant. Lock and validate in one transaction.
create function private.staff_booking_action(p_booking uuid, p_action text, p_reason text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare b public.bookings%rowtype; next_status text; today date;
begin
  if not private.is_staff() then raise exception 'Approved staff membership required.' using errcode='42501'; end if;
  if p_action is null or p_action not in ('check_in','check_out','cancel','record_payment') then
    raise exception 'Unknown staff operation.' using errcode='22023';
  end if;
  select * into b from public.bookings where id=p_booking for update;
  if not found then raise exception 'Booking not found.' using errcode='P0002'; end if;
  select (now() at time zone time_zone)::date into today from public.settings where id=1;
  next_status := b.status;

  if p_action='check_in' then
    if b.status <> 'confirmed' or today < b.start_date or today >= b.end_date then
      raise exception 'Only confirmed arrivals within their reserved stay can check in.';
    end if;
    next_status := 'checked_in';
  elsif p_action='check_out' then
    if b.status <> 'checked_in' or today < b.start_date then
      raise exception 'Only checked-in guests can check out.';
    end if;
    next_status := 'completed';
  elsif p_action='cancel' then
    if b.status <> 'confirmed' or b.is_paid then
      raise exception 'Only unpaid confirmed bookings can be cancelled. Paid stays need a reviewed refund workflow.';
    end if;
    if p_reason is null or char_length(trim(p_reason)) not between 5 and 500 then raise exception 'Provide a cancellation reason (5–500 characters).'; end if;
    next_status := 'cancelled';
  elsif p_action='record_payment' then
    if not exists(select 1 from private.staff_members where user_id=auth.uid() and role='admin') then
      raise exception 'Only approved administrators may record verified payments.' using errcode='42501';
    end if;
    if b.is_demo or b.is_paid or b.status='cancelled' then raise exception 'Payment cannot be recorded for demo, paid, or cancelled reservations.'; end if;
    if p_reason is null or char_length(trim(p_reason)) not between 5 and 500 then raise exception 'Provide a verified receipt reference (5–500 characters).'; end if;
  end if;

  -- Dates, capacity, price snapshots and the exclusion constraint remain untouched.
  update public.bookings set status=next_status,
    is_paid=case when p_action='record_payment' then true else is_paid end
  where id=b.id;
  insert into private.booking_events(booking_id,actor_id,action,previous_status,new_status,amount,reason)
  values(b.id,auth.uid(),p_action,b.status,next_status,
    case when p_action='record_payment' then b.total_price else null end,
    case when p_action in ('cancel','record_payment') then trim(p_reason) else null end);
  return b.id;
end;
$$;
revoke all on function private.staff_booking_action(uuid,text,text) from public, anon;
grant execute on function private.staff_booking_action(uuid,text,text) to authenticated;

create function public.staff_check_in(p_booking uuid) returns uuid
language sql security invoker set search_path = '' as $$ select private.staff_booking_action(p_booking,'check_in'); $$;
create function public.staff_check_out(p_booking uuid) returns uuid
language sql security invoker set search_path = '' as $$ select private.staff_booking_action(p_booking,'check_out'); $$;
create function public.staff_cancel_booking(p_booking uuid,p_reason text) returns uuid
language sql security invoker set search_path = '' as $$ select private.staff_booking_action(p_booking,'cancel',p_reason); $$;
create function public.staff_record_payment(p_booking uuid,p_reference text) returns uuid
language sql security invoker set search_path = '' as $$ select private.staff_booking_action(p_booking,'record_payment',p_reference); $$;
revoke all on function public.staff_check_in(uuid),public.staff_check_out(uuid),public.staff_cancel_booking(uuid,text),public.staff_record_payment(uuid,text) from public, anon;
grant execute on function public.staff_check_in(uuid),public.staff_check_out(uuid),public.staff_cancel_booking(uuid,text),public.staff_record_payment(uuid,text) to authenticated;

create function private.staff_booking_audit(p_booking uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_staff() then raise exception 'Approved staff membership required.' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at desc,e.id) from private.booking_events e where e.booking_id=p_booking),'[]'::jsonb);
end;
$$;
revoke all on function private.staff_booking_audit(uuid) from public, anon;
grant execute on function private.staff_booking_audit(uuid) to authenticated;
create function public.staff_booking_audit(p_booking uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.staff_booking_audit(p_booking); $$;
revoke all on function public.staff_booking_audit(uuid) from public, anon;
grant execute on function public.staff_booking_audit(uuid) to authenticated;

-- SQL aggregation avoids the API row limit silently truncating financial/occupancy data.
create function private.staff_dashboard(p_start date,p_end date) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb; zone text; today date;
begin
  if not private.is_staff() then raise exception 'Approved staff membership required.' using errcode='42501'; end if;
  select time_zone into zone from public.settings where id=1;
  today := (now() at time zone zone)::date;
  if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end)
    or p_end < p_start or p_end-p_start > 365 or p_end > today then
    raise exception 'Choose a valid historical range of up to 366 days.';
  end if;
  with days as (
    select p_start+i as day from generate_series(0,p_end-p_start) i
  ), reservations as (
    select * from public.bookings where (created_at at time zone zone)::date between p_start and p_end
  ), collections as (
    select e.* from private.booking_events e join public.bookings b on b.id=e.booking_id
    where e.action='record_payment' and not b.is_demo and (e.created_at at time zone zone)::date between p_start and p_end
  ), stays as (
    select * from public.bookings where status in ('confirmed','checked_in','completed') and start_date <= p_end and end_date > p_start
  ), inventory as (
    select count(*)::numeric as cabins from public.cabins c where is_active or exists(select 1 from stays s where s.cabin_id=c.id)
  ), daily as (
    select d.day as date,
      coalesce((select sum(total_price) from reservations r where (r.created_at at time zone zone)::date=d.day and r.status<>'cancelled'),0) as booked_value,
      coalesce((select sum(amount) from collections c where (c.created_at at time zone zone)::date=d.day),0) as paid_revenue
    from days d order by d.day
  ), duration_counts as (
    select case when num_nights<=2 then '1–2 nights' when num_nights<=4 then '3–4 nights' when num_nights<=7 then '5–7 nights' when num_nights<=14 then '8–14 nights' else '15+ nights' end as name,
      count(*) as value, min(num_nights) as sort_order
    from public.bookings where status<>'cancelled' and start_date between p_start and p_end group by 1
  ), recent as (
    select b.id,b.start_date,b.num_nights,b.total_price,g.full_name as guest_name,c.name as cabin_name
    from public.bookings b join public.guests g on g.id=b.guest_id join public.cabins c on c.id=b.cabin_id
    order by b.created_at desc,b.id limit 5
  )
  select jsonb_build_object(
    'booking_count',(select count(*) from reservations),
    'paid_revenue',(select coalesce(sum(amount),0) from collections),
    'checkins',(select count(*) from private.booking_events where action='check_in' and (created_at at time zone zone)::date between p_start and p_end),
    'occupancy',coalesce(round(100.0*(select coalesce(sum(least(end_date,p_end+1)-greatest(start_date,p_start)),0) from stays)/nullif((select cabins from inventory)*(p_end-p_start+1),0),1),0),
    'daily',(select coalesce(jsonb_agg(to_jsonb(d)),'[]'::jsonb) from daily d),
    'durations',(select coalesce(jsonb_agg(jsonb_build_object('name',name,'value',value) order by sort_order),'[]'::jsonb) from duration_counts),
    'recent',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from recent r)
  ) into result;
  return result;
end;
$$;
revoke all on function private.staff_dashboard(date,date) from public, anon;
grant execute on function private.staff_dashboard(date,date) to authenticated;
create function public.staff_dashboard(p_start date,p_end date) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.staff_dashboard(p_start,p_end); $$;
revoke all on function public.staff_dashboard(date,date) from public, anon;
grant execute on function public.staff_dashboard(date,date) to authenticated;

commit;
