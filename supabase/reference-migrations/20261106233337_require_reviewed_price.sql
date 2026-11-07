-- A reviewed browser total is an acknowledgement, never a pricing authority.
create function private.create_booking_reviewed(p_cabin uuid,p_start date,p_end date,p_guests integer,p_breakfast boolean,p_observations text,p_request uuid,p_expected_total numeric)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); q jsonb;
begin
  if uid is null then raise exception 'Sign in to complete your reservation.' using errcode='42501'; end if;
  -- Replays return the original snapshot, even if current catalog prices changed.
  if exists(select 1 from public.bookings where guest_id=uid and request_id=p_request) then
    return private.create_booking(p_cabin,p_start,p_end,p_guests,p_breakfast,p_observations,p_request);
  end if;
  perform 1 from public.settings where id=1 for share;
  perform 1 from public.cabins where id=p_cabin for share;
  q := private.quote_booking(p_cabin,p_start,p_end,p_guests,p_breakfast);
  if p_expected_total is null or p_expected_total is distinct from (q->>'total_price')::numeric then
    raise exception 'The price has changed. Please review the updated total before reserving.';
  end if;
  return private.create_booking(p_cabin,p_start,p_end,p_guests,p_breakfast,p_observations,p_request);
end;
$$;
revoke all on function private.create_booking_reviewed(uuid,date,date,integer,boolean,text,uuid,numeric) from public,anon;
grant execute on function private.create_booking_reviewed(uuid,date,date,integer,boolean,text,uuid,numeric) to authenticated;
drop function public.create_booking(uuid,date,date,integer,boolean,text,uuid);
create function public.create_booking(p_cabin uuid,p_start date,p_end date,p_guests integer,p_breakfast boolean,p_observations text,p_request uuid,p_expected_total numeric)
returns uuid language sql security invoker set search_path = '' as $$
  select private.create_booking_reviewed(p_cabin,p_start,p_end,p_guests,p_breakfast,p_observations,p_request,p_expected_total);
$$;
revoke all on function public.create_booking(uuid,date,date,integer,boolean,text,uuid,numeric) from public,anon;
grant execute on function public.create_booking(uuid,date,date,integer,boolean,text,uuid,numeric) to authenticated;
