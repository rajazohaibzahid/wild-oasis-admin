-- Synthetic, isolated PostgreSQL flow. This does not test HTTP Auth or email delivery.
begin;
select set_config('flow.customer',gen_random_uuid()::text,true), set_config('flow.staff',gen_random_uuid()::text,true), set_config('flow.cabin',(select id::text from public.cabins where name='Cedar & Still'),true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('flow.'||label)::uuid,'flow-'||label||'@example.invalid',now(),jsonb_build_object('full_name','Synthetic Flow '||label) from unnest(array['customer','staff']) label;
insert into private.staff_members(user_id,role) values(current_setting('flow.staff')::uuid,'admin');
select set_config('request.jwt.claim.sub',current_setting('flow.customer'),true);
set local role authenticated;
select set_config('flow.booking',public.create_booking(current_setting('flow.cabin')::uuid,(now() at time zone 'Asia/Karachi')::date,(now() at time zone 'Asia/Karachi')::date+3,2,false,'Local cross-application test',gen_random_uuid(),690)::text,true);
reset role;
select set_config('request.jwt.claim.sub',current_setting('flow.staff'),true);
set local role authenticated;
do $$ begin
 if not public.staff_access() then raise exception 'FAIL: staff access';end if;
 if not exists(select 1 from public.bookings where id=current_setting('flow.booking')::uuid and status='confirmed' and not is_paid) then raise exception 'FAIL: customer reservation missing in admin read';end if;
 if not exists(select 1 from public.guests where id=current_setting('flow.customer')::uuid) then raise exception 'FAIL: staff guest details';end if;
 perform public.staff_check_in(current_setting('flow.booking')::uuid);
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('flow.customer'),true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.bookings where id=current_setting('flow.booking')::uuid and status='checked_in' and not is_paid) then raise exception 'FAIL: customer cannot see checked-in status';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('flow.staff'),true);
set local role authenticated;
select public.staff_check_out(current_setting('flow.booking')::uuid);
update public.cabins set regular_price=280 where id=current_setting('flow.cabin')::uuid;
update public.settings set breakfast_price=20 where id=1;
reset role;
select set_config('request.jwt.claim.sub',current_setting('flow.customer'),true);
set local role authenticated;
do $$ declare q jsonb; d date:=(now() at time zone 'Asia/Karachi')::date; c uuid:=current_setting('flow.cabin')::uuid; begin
 if not exists(select 1 from public.bookings where id=current_setting('flow.booking')::uuid and status='completed' and not is_paid and total_price=690) then raise exception 'FAIL: customer history or booked price snapshot';end if;
 if (select regular_price from public.cabins where id=c)<>280 then raise exception 'FAIL: public listing price after staff edit';end if;
 q:=public.quote_booking(c,d+20,d+23,2,true);
 if (q->>'total_price')::numeric<>870 then raise exception 'FAIL: quote ignores current cabin/settings';end if;
 perform set_config('flow.cancelled',public.create_booking(c,d+20,d+23,2,true,'Cancellation fixture',gen_random_uuid(),870)::text,true);
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('flow.staff'),true);
set local role authenticated;
select public.staff_cancel_booking(current_setting('flow.cancelled')::uuid,'Synthetic guest cancellation');
-- An inactive cabin is hidden by the existing catalog RLS even when a guest has history.
update public.cabins set is_active=false where id=current_setting('flow.cabin')::uuid;
reset role;
select set_config('request.jwt.claim.sub',current_setting('flow.customer'),true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.bookings where id=current_setting('flow.cancelled')::uuid and status='cancelled') then raise exception 'FAIL: customer cancelled history';end if;
 if exists(select 1 from public.cabins where id=current_setting('flow.cabin')::uuid) then raise exception 'FAIL: inactive cabin unexpectedly public';end if;
 if not exists(select 1 from public.bookings where id=current_setting('flow.booking')::uuid) then raise exception 'FAIL: deactivation removed guest history';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('flow.staff'),true);
set local role authenticated;
update public.cabins set is_active=true where id=current_setting('flow.cabin')::uuid;
reset role;
select set_config('request.jwt.claim.sub',current_setting('flow.customer'),true);
set local role authenticated;
do $$ declare d date:=(now() at time zone 'Asia/Karachi')::date; begin
 if not exists(select 1 from public.available_cabins(d+20,d+23) id where id=current_setting('flow.cabin')::uuid) then raise exception 'FAIL: cancellation availability';end if;
 if exists(select 1 from public.available_cabins(d,d+3) id where id=current_setting('flow.cabin')::uuid) then raise exception 'FAIL: completed historical stay lost inventory';end if;
end $$;
reset role;
rollback;
select 'PASS: customer create → staff read/checkin/checkout → customer status; catalog/settings update → trusted quote; cancellation → customer history/availability; inactive-cabin RLS. All fixtures rolled back.' as result;
