begin;
select set_config('test.customer',gen_random_uuid()::text,true),set_config('test.admin',gen_random_uuid()::text,true),set_config('test.manager',gen_random_uuid()::text,true),set_config('test.other',gen_random_uuid()::text,true),set_config('test.cabin',(select id::text from public.cabins where name='Cedar & Still'),true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('test.'||label)::uuid,'admin-test-'||label||'@example.invalid',now(),jsonb_build_object('full_name','Synthetic '||label,'role','admin') from unnest(array['customer','admin','manager','other']) label;
insert into private.staff_members(user_id,role) values(current_setting('test.admin')::uuid,'admin'),(current_setting('test.manager')::uuid,'manager');
select set_config('request.jwt.claim.sub',current_setting('test.customer'),true);
set local role authenticated;
do $$declare denied boolean; begin
  if public.staff_access() then raise exception 'FAIL: customer metadata privilege escalation'; end if;
  if (select count(*) from public.guests)<>1 then raise exception 'FAIL: profile isolation'; end if;
  denied:=false;begin perform public.staff_dashboard(current_date-7,current_date);exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: customer analytics access';end if;
  denied:=false;begin perform public.staff_booking_audit(gen_random_uuid());exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: customer audit access';end if;
  denied:=false;begin perform public.staff_check_in(gen_random_uuid());exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: customer staff operation';end if;
  denied:=false;begin perform * from private.booking_events;exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: customer audit table access';end if;
  denied:=false;begin insert into storage.objects(bucket_id,name) values('cabin-images','unauthorized.png');exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: customer cabin storage write';end if;
end;$$;
reset role;

-- Create fixtures using the actual customer RPC; keep guest ownership independent of staff.
select set_config('test.booking',public.create_booking(current_setting('test.cabin')::uuid,(now() at time zone 'Asia/Karachi')::date,(now() at time zone 'Asia/Karachi')::date+3,2,false,'Test arrival',gen_random_uuid(),690)::text,true);
-- Foundation create RPC is definer but requires Auth context (currently the customer).
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
set local role authenticated;
do $$declare denied boolean; b uuid:=current_setting('test.booking')::uuid; stats jsonb; new_cabin uuid; before_price numeric; begin
  if not public.staff_access() then raise exception 'FAIL: staff membership'; end if;
  if (select count(*) from public.guests)<>4 then raise exception 'FAIL: staff guest read';end if;
  denied:=false;begin perform public.staff_check_out(b);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: checkout before checkin';end if;
  perform public.staff_check_in(b);
  if (select status<>'checked_in' or is_paid from public.bookings where id=b) then raise exception 'FAIL: checkin state or payment mutation';end if;
  denied:=false;begin perform public.staff_check_in(b);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: duplicate checkin';end if;
  denied:=false;begin perform public.staff_cancel_booking(b,'Cannot cancel checked-in stay');exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: cancel checked-in booking';end if;
  perform public.staff_check_out(b);
  if (select status<>'completed' or is_paid from public.bookings where id=b) then raise exception 'FAIL: checkout state or payment mutation';end if;
  denied:=false;begin perform public.staff_check_out(b);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: duplicate checkout';end if;
  denied:=false;begin perform public.staff_record_payment(b,'Verified receipt');exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: demo payment';end if;
  if jsonb_array_length(public.staff_booking_audit(b))<>2 then raise exception 'FAIL: atomic audit trail';end if;
  denied:=false;begin update public.bookings set is_paid=true where id=b;exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: direct staff booking write';end if;
  stats:=public.staff_dashboard((now() at time zone 'Asia/Karachi')::date-6,(now() at time zone 'Asia/Karachi')::date);
  if (stats->>'checkins')::int<>1 or (stats->>'paid_revenue')::numeric<>0 then raise exception 'FAIL: collections or checkin metrics';end if;
  if (stats->>'occupancy')::numeric <> 1.8 then raise exception 'FAIL: clipped cabin nights denominator';end if;
  insert into storage.objects(bucket_id,name) values('cabin-images','staff-fixture.png');
  if not found then raise exception 'FAIL: staff storage write';end if;
  -- Real catalog/settings CRUD through RLS.
  insert into public.cabins(name,subtitle,description,max_capacity,regular_price,discount,image) values('Synthetic cabin','Test','Fixture',2,200,0,'https://example.invalid/cabin.jpg') returning id into new_cabin;
  update public.cabins set regular_price=220 where id=new_cabin;
  if (select regular_price from public.cabins where id=new_cabin)<>220 then raise exception 'FAIL: cabin update';end if;
  delete from public.cabins where id=new_cabin;
  if found is false then raise exception 'FAIL: cabin delete';end if;
  update public.settings set breakfast_price=19 where id=1;
  if not found then raise exception 'FAIL: staff settings update';end if;
  denied:=false;begin update public.settings set min_booking_length=30,max_booking_length=5;exception when check_violation then denied:=true;end;
  if not denied then raise exception 'FAIL: inconsistent settings accepted';end if;
  denied:=false;begin update public.settings set max_advance_days=1;exception when check_violation then denied:=true;end;
  if not denied then raise exception 'FAIL: impossible booking horizon accepted';end if;
end;$$;
reset role;
select 'PASS: staff read, cabin CRUD, settings constraints, state transitions, payment preservation, demo exclusion, audit and occupancy.' as result;

-- Reuse future customer reservations to test cancellation/availability and payment constraints.
select set_config('request.jwt.claim.sub',current_setting('test.customer'),true);
set local role authenticated;
select set_config('test.future',public.create_booking(current_setting('test.cabin')::uuid,(now() at time zone 'Asia/Karachi')::date+20,(now() at time zone 'Asia/Karachi')::date+23,2,false,'Cancel fixture',gen_random_uuid(),690)::text,true);
select set_config('test.payment',public.create_booking(current_setting('test.cabin')::uuid,(now() at time zone 'Asia/Karachi')::date+30,(now() at time zone 'Asia/Karachi')::date+33,2,false,'Payment fixture',gen_random_uuid(),690)::text,true);
reset role;
-- Only the isolated superuser may mark a synthetic fixture non-demo.
update public.bookings set is_demo=false where id=current_setting('test.payment')::uuid;
select set_config('request.jwt.claim.sub',current_setting('test.manager'),true);
set local role authenticated;
do $$declare denied boolean:=false;begin
  begin perform public.staff_record_payment(current_setting('test.payment')::uuid,'Receipt fixture');exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: manager financial authorization';end if;
end;$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
set local role authenticated;
do $$declare denied boolean; b uuid:=current_setting('test.future')::uuid; p uuid:=current_setting('test.payment')::uuid; c uuid:=current_setting('test.cabin')::uuid; d date:=(now() at time zone 'Asia/Karachi')::date; before_count int; begin
  denied:=false;begin perform public.staff_check_in(b);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: future checkin';end if;
  denied:=false;begin perform public.staff_cancel_booking(b,'x');exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: cancellation reason validation';end if;
  perform public.staff_cancel_booking(b,'Guest requested cancellation');
  if (select status from public.bookings where id=b)<>'cancelled' then raise exception 'FAIL: cancelled state';end if;
  if not exists(select 1 from public.available_cabins(d+20,d+23) id where id=c) then raise exception 'FAIL: cancellation releases availability';end if;
  perform public.staff_record_payment(p,'Verified synthetic receipt 001');
  if not (select is_paid from public.bookings where id=p) then raise exception 'FAIL: payment not recorded';end if;
  denied:=false;begin perform public.staff_record_payment(p,'Duplicate payment');exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: duplicate payment';end if;
  denied:=false;begin perform public.staff_cancel_booking(p,'Paid stay cannot cancel');exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: paid cancellation bypass';end if;
  if (public.staff_dashboard(d,d)->>'paid_revenue')::numeric<>690 then raise exception 'FAIL: collection ledger';end if;
  if (select count(*) from public.cabin_calendar(c,d+30,d+33))<>3 then raise exception 'FAIL: payment changed inventory';end if;
  denied:=false;begin perform public.staff_dashboard(d-400,d);exception when raise_exception then denied:=true;end;
  if not denied then raise exception 'FAIL: unbounded analytics';end if;
end;$$;
reset role;
select 'PASS: future arrival denial, cancellation releases inventory, manager payment denial, paid cancellation denial and verified collection accounting.' as result;

-- Membership revocation takes effect without issuing a new token.
delete from private.staff_members where user_id=current_setting('test.admin')::uuid;
set local role authenticated;
do $$declare denied boolean:=false;begin
  if public.staff_access() then raise exception 'FAIL: stale staff membership';end if;
  begin perform public.staff_check_out(current_setting('test.payment')::uuid);exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: revoked staff operation';end if;
end;$$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$declare denied boolean:=false;begin
  begin perform public.staff_access();exception when insufficient_privilege then denied:=true;end;
  if not denied then raise exception 'FAIL: anonymous staff endpoint';end if;
end;$$;
reset role;
rollback;
select 'PASS: anonymous denial and immediate staff revocation. All synthetic fixtures rolled back.' as result;
