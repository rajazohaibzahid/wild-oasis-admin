-- Run on the NEW development project only. Everything is rolled back.
begin;
select set_config('test.a', gen_random_uuid()::text, true),
       set_config('test.b', gen_random_uuid()::text, true),
       set_config('test.admin', gen_random_uuid()::text, true),
       set_config('test.cabin', (select id::text from public.cabins where name='Cedar & Still'), true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('test.'||label)::uuid,'security-'||label||'-'||current_setting('test.'||label)||'@example.invalid',now(),jsonb_build_object('full_name','Synthetic Test '||label)
from unnest(array['a','b','admin']) label;
insert into private.staff_members(user_id,role) values(current_setting('test.admin')::uuid,'admin');
update auth.users set raw_user_meta_data=raw_user_meta_data||'{"role":"admin","is_admin":true}'::jsonb where id=current_setting('test.a')::uuid;
select set_config('request.jwt.claim.sub',current_setting('test.a'),true);
set local role authenticated;
do $$
declare bid uuid; retry_id uuid; req uuid:=gen_random_uuid(); c uuid:=current_setting('test.cabin')::uuid; d date:=(now() at time zone 'Asia/Karachi')::date+200; q jsonb; denied boolean;
begin
  if private.is_staff() then raise exception 'FAIL: editable metadata cannot grant staff privileges';end if;
  if (select count(*) from public.guests)<>1 then raise exception 'FAIL: customer A profile isolation'; end if;
  update public.guests set full_name='Updated Synthetic A' where id=current_setting('test.a')::uuid;
  if not found then raise exception 'FAIL: own profile update'; end if;
  update public.guests set full_name='Unauthorized' where id=current_setting('test.b')::uuid;
  if found then raise exception 'FAIL: cross-customer profile update'; end if;
  denied:=false;begin update public.guests set email='forged@example.invalid' where id=current_setting('test.a')::uuid; exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: email column write';end if;
  denied:=false;begin insert into private.staff_members(user_id,role) values(current_setting('test.a')::uuid,'admin'); exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: staff escalation';end if;
  update public.cabins set regular_price=1 where id=c;
  if found then raise exception 'FAIL: customer cabin price update'; end if;
  update public.settings set breakfast_price=0;
  if found then raise exception 'FAIL: customer settings update'; end if;
  q:=public.quote_booking(c,d,d+3,2,true);
  if (q->>'total_price')::numeric<>798 then raise exception 'FAIL: trusted pricing';end if;
  denied:=false;begin perform public.create_booking(c,d,d+3,2,true,'',gen_random_uuid(),1);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: reviewed price tampering';end if;
  bid:=public.create_booking(c,d,d+3,2,true,'Synthetic security fixture',req,798);
  retry_id:=public.create_booking(c,d,d+3,2,true,'Synthetic security fixture',req,798);
  if bid<>retry_id or (select count(*) from public.bookings)<>1 then raise exception 'FAIL: idempotency';end if;
  if (select is_paid from public.bookings where id=bid) then raise exception 'FAIL: unpaid status';end if;
  if not (select is_demo from public.bookings where id=bid) then raise exception 'FAIL: portfolio booking must be marked demo';end if;
  denied:=false;begin update public.bookings set is_paid=true where id=bid;exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: payment status write';end if;
  denied:=false;begin perform public.create_booking(c,d,d+3,1,false,'Different request',req,798);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: idempotency payload conflict';end if;
  denied:=false;begin perform public.create_booking(c,d+1,d+4,2,false,'',gen_random_uuid(),690);exception when exclusion_violation then denied:=true;end;
  if not denied then raise exception 'FAIL: overlap rejection';end if;
  denied:=false;begin perform public.create_booking(c,d+5,d+8,3,false,'',gen_random_uuid(),690);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: capacity validation';end if;
  denied:=false;begin perform public.create_booking(c,d+5,d+6,2,false,'',gen_random_uuid(),690);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: minimum stay validation';end if;
  denied:=false;begin perform public.create_booking(c,d-250,d-247,2,false,'',gen_random_uuid(),690);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: past-date validation';end if;
  perform public.create_booking(c,d+3,d+5,2,false,'Back-to-back synthetic fixture',gen_random_uuid(),460);
  if (select count(*) from public.bookings)<>2 then raise exception 'FAIL: back-to-back dates';end if;
end;$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.b'),true);
set local role authenticated;
do $$begin
  if (select count(*) from public.guests)<>1 or (select count(*) from public.bookings)<>0 then raise exception 'FAIL: customer B ownership';end if;
  if (select count(*) from public.cabin_calendar(current_setting('test.cabin')::uuid,(now() at time zone 'Asia/Karachi')::date+200,(now() at time zone 'Asia/Karachi')::date+205))<>5 then raise exception 'FAIL: safe availability calendar';end if;
end;$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
set local role authenticated;
do $$begin
  if not private.is_staff() or (select count(*) from public.guests)<>3 or (select count(*) from public.bookings)<>2 then raise exception 'FAIL: admin read access';end if;
  update public.cabins set subtitle=subtitle where id=current_setting('test.cabin')::uuid;
  if not found then raise exception 'FAIL: admin cabin management';end if;
end;$$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$declare denied boolean:=false;begin
  if (select count(*) from public.cabins)<>8 then raise exception 'FAIL: public cabins';end if;
  begin perform * from public.bookings;exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: anonymous booking read';end if;
end;$$;
reset role;
rollback;
select 'PASS: two customers and admin; ownership, profile grants, staff escalation, pricing, payment protection, idempotency, overlap, back-to-back, capacity, dates, availability and public access. All fixtures rolled back.' as result;
