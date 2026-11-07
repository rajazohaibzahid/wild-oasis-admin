-- Fresh-project migration. Never apply to the legacy Wild Oasis project.
create extension if not exists btree_gist with schema extensions;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
alter default privileges in schema private revoke execute on functions from public;

create table public.cabins (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 100),
  subtitle text not null,
  description text not null,
  max_capacity smallint not null check (max_capacity between 1 and 20),
  regular_price numeric(12,2) not null check (regular_price > 0),
  discount numeric(12,2) not null default 0 check (discount >= 0 and discount < regular_price),
  image text not null,
  gallery text[] not null default '{}',
  amenities text[] not null default '{}',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null default '' check (char_length(full_name) <= 100),
  email text not null,
  phone text check (phone is null or char_length(phone) <= 30),
  nationality text check (nationality is null or char_length(nationality) <= 80),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 300),
  created_at timestamptz not null default now()
);

create table public.settings (
  id smallint primary key default 1 check (id = 1),
  min_booking_length smallint not null default 2 check (min_booking_length >= 1),
  max_booking_length smallint not null default 21 check (max_booking_length >= min_booking_length),
  max_guests_per_booking smallint not null default 8 check (max_guests_per_booking between 1 and 20),
  breakfast_price numeric(10,2) not null default 18 check (breakfast_price >= 0),
  max_advance_days smallint not null default 365 check (max_advance_days between 1 and 730),
  currency text not null default 'USD' check (currency = 'USD'),
  time_zone text not null default 'Asia/Karachi' check (time_zone = 'Asia/Karachi')
);
insert into public.settings(id) values (1);

create table private.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'manager')),
  created_at timestamptz not null default now()
);
alter table private.staff_members enable row level security;
revoke all on private.staff_members from anon, authenticated;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid not null references public.cabins(id) on delete restrict,
  guest_id uuid not null references public.guests(id) on delete restrict,
  start_date date not null,
  end_date date not null check (end_date > start_date),
  num_nights integer generated always as (end_date - start_date) stored,
  num_guests smallint not null check (num_guests between 1 and 20),
  nightly_price numeric(12,2) not null check (nightly_price > 0),
  breakfast_unit_price numeric(10,2) not null check (breakfast_unit_price >= 0),
  cabin_price numeric(12,2) not null check (cabin_price >= 0),
  extras_price numeric(12,2) not null check (extras_price >= 0),
  total_price numeric(12,2) not null check (total_price = cabin_price + extras_price),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'confirmed' check (status in ('confirmed','checked_in','completed','cancelled')),
  has_breakfast boolean not null default false,
  is_paid boolean not null default false,
  observations text not null default '' check (char_length(observations) <= 1000),
  request_id uuid not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (guest_id, request_id),
  constraint no_overlapping_stays exclude using gist (
    cabin_id with =, daterange(start_date, end_date, '[)') with &&
  ) where (status in ('confirmed','checked_in','completed'))
);
create index bookings_guest_created_idx on public.bookings(guest_id, created_at desc);
create index cabins_order_idx on public.cabins(display_order) where is_active;

create function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from private.staff_members where user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;

-- Trigger reads only display metadata; privileges never come from user metadata.
create function private.sync_guest() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.guests(id, full_name, email)
    values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''),100), coalesce(new.email,''));
  else
    update public.guests set email = coalesce(new.email,'') where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function private.sync_guest() from public, anon, authenticated;
create trigger on_customer_created after insert on auth.users for each row execute function private.sync_guest();
create trigger on_customer_email_changed after update of email on auth.users for each row execute function private.sync_guest();

alter table public.cabins enable row level security;
alter table public.guests enable row level security;
alter table public.settings enable row level security;
alter table public.bookings enable row level security;

revoke all on public.cabins, public.guests, public.settings, public.bookings from anon, authenticated;
grant select on public.cabins, public.settings to anon, authenticated;
grant insert, update, delete on public.cabins to authenticated;
grant update on public.settings to authenticated;
grant select on public.guests, public.bookings to authenticated;
grant update(full_name, phone, nationality, avatar_path) on public.guests to authenticated;

create policy cabins_public_read on public.cabins for select to anon, authenticated using (is_active);
create policy cabins_staff_manage on public.cabins for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy settings_public_read on public.settings for select to anon, authenticated using (true);
create policy settings_staff_update on public.settings for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy guests_own_read on public.guests for select to authenticated using (id = (select auth.uid()) or (select private.is_staff()));
create policy guests_own_update on public.guests for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy bookings_own_read on public.bookings for select to authenticated using (guest_id = (select auth.uid()) or (select private.is_staff()));

-- Private definer implementations have explicit grants. Public RPCs are invokers.
create function private.quote_booking(p_cabin uuid, p_start date, p_end date, p_guests integer, p_breakfast boolean)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare c public.cabins%rowtype; s public.settings%rowtype; n integer; base numeric; extras numeric; d date;
begin
  select * into s from public.settings where id = 1;
  select * into c from public.cabins where id = p_cabin and is_active;
  if not found then raise exception 'Cabin is not available.'; end if;
  d := (now() at time zone s.time_zone)::date;
  n := p_end - p_start;
  if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end) or p_start < d or p_end > d + s.max_advance_days or n < s.min_booking_length or n > s.max_booking_length then
    raise exception 'Choose valid dates within the allowed booking window and stay length.';
  end if;
  if p_guests is null or p_guests < 1 or p_guests > least(c.max_capacity,s.max_guests_per_booking) then raise exception 'Guest count exceeds cabin capacity.'; end if;
  if p_breakfast is null then raise exception 'Choose a breakfast option.'; end if;
  base := (c.regular_price-c.discount)*n;
  extras := case when p_breakfast then s.breakfast_price*p_guests*n else 0 end;
  return jsonb_build_object('nightly_price', c.regular_price-c.discount, 'breakfast_unit_price',s.breakfast_price,'cabin_price',base,'extras_price',extras,'total_price',base+extras,'currency',s.currency,'num_nights',n,'available',not exists (
    select 1 from public.bookings b where b.cabin_id = p_cabin and b.status in ('confirmed','checked_in','completed') and daterange(b.start_date,b.end_date,'[)') && daterange(p_start,p_end,'[)')
  ));
end;
$$;
revoke all on function private.quote_booking(uuid,date,date,integer,boolean) from public;
grant execute on function private.quote_booking(uuid,date,date,integer,boolean) to anon, authenticated;
create function public.quote_booking(p_cabin uuid,p_start date,p_end date,p_guests integer,p_breakfast boolean default false)
returns jsonb language sql stable security invoker set search_path = '' as $$ select private.quote_booking(p_cabin,p_start,p_end,p_guests,p_breakfast); $$;
revoke all on function public.quote_booking(uuid,date,date,integer,boolean) from public;
grant execute on function public.quote_booking(uuid,date,date,integer,boolean) to anon, authenticated;

create function private.available_cabins(p_start date,p_end date) returns setof uuid
language plpgsql stable security definer set search_path = '' as $$
declare s public.settings%rowtype; d date;
begin
  select * into s from public.settings where id=1;
  d := (now() at time zone s.time_zone)::date;
  if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end) or p_start < d or p_end > d+s.max_advance_days or p_end-p_start < s.min_booking_length or p_end-p_start > s.max_booking_length then raise exception 'Choose dates within the allowed booking window and stay length.'; end if;
  return query select c.id from public.cabins c where c.is_active and not exists (
    select 1 from public.bookings b where b.cabin_id=c.id and b.status in ('confirmed','checked_in','completed') and daterange(b.start_date,b.end_date,'[)') && daterange(p_start,p_end,'[)')
  );
end;
$$;
revoke all on function private.available_cabins(date,date) from public;
grant execute on function private.available_cabins(date,date) to anon, authenticated;
create function public.available_cabins(p_start date,p_end date) returns setof uuid
language sql stable security invoker set search_path = '' as $$ select * from private.available_cabins(p_start,p_end); $$;
revoke all on function public.available_cabins(date,date) from public;
grant execute on function public.available_cabins(date,date) to anon, authenticated;

create function private.cabin_calendar(p_cabin uuid,p_start date,p_end date) returns table(day date)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end) or p_end<=p_start or p_end-p_start>370 then raise exception 'Calendar window must be 1 to 370 days.'; end if;
  return query select distinct (b.start_date + g.i)::date from public.bookings b
    cross join lateral generate_series(0,b.end_date-b.start_date-1) as g(i)
    where b.cabin_id=p_cabin and b.status in ('confirmed','checked_in','completed')
    and exists(select 1 from public.cabins c where c.id=p_cabin and c.is_active)
    and b.start_date+g.i >= p_start and b.start_date+g.i < p_end;
end;
$$;
revoke all on function private.cabin_calendar(uuid,date,date) from public;
grant execute on function private.cabin_calendar(uuid,date,date) to anon, authenticated;
create function public.cabin_calendar(p_cabin uuid,p_start date,p_end date) returns table(day date)
language sql stable security invoker set search_path = '' as $$ select * from private.cabin_calendar(p_cabin,p_start,p_end); $$;
revoke all on function public.cabin_calendar(uuid,date,date) from public;
grant execute on function public.cabin_calendar(uuid,date,date) to anon, authenticated;

create function private.create_booking(p_cabin uuid,p_start date,p_end date,p_guests integer,p_breakfast boolean,p_observations text,p_request uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); q jsonb; existing public.bookings%rowtype; result uuid;
begin
  if uid is null then raise exception 'Sign in to complete your reservation.' using errcode='42501'; end if;
  if not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then raise exception 'Verify your email before reserving.' using errcode='42501'; end if;
  if p_request is null then raise exception 'Reservation request ID is required.'; end if;
  if p_observations is null or char_length(p_observations)>1000 then raise exception 'Keep special requests within 1000 characters.'; end if;
  -- Serialize customer retries; the GiST exclusion constraint protects inventory across customers.
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  select * into existing from public.bookings where guest_id=uid and request_id=p_request;
  if found then
    if existing.cabin_id is distinct from p_cabin or existing.start_date is distinct from p_start or existing.end_date is distinct from p_end or existing.num_guests is distinct from p_guests or existing.has_breakfast is distinct from p_breakfast or existing.observations is distinct from p_observations then raise exception 'This request ID was already used for a different reservation.'; end if;
    return existing.id;
  end if;
  if not exists(select 1 from public.guests where id=uid and length(trim(full_name))>=2) then raise exception 'Add your full name in your profile before reserving.'; end if;
  if (select count(*) from public.bookings where guest_id=uid and created_at>now()-interval '1 hour') >= 10 then raise exception 'Reservation limit reached. Please try again later.'; end if;
  -- Lock mutable pricing/config rows so a quote is internally consistent during creation.
  perform 1 from public.settings where id=1 for share;
  perform 1 from public.cabins where id=p_cabin for share;
  q := private.quote_booking(p_cabin,p_start,p_end,p_guests,p_breakfast);
  if not (q->>'available')::boolean then raise exception 'These dates were just reserved. Please choose another stay.' using errcode='23P01'; end if;
  insert into public.bookings(cabin_id,guest_id,start_date,end_date,num_guests,nightly_price,breakfast_unit_price,cabin_price,extras_price,total_price,has_breakfast,observations,request_id)
    values(p_cabin,uid,p_start,p_end,p_guests,(q->>'nightly_price')::numeric,(q->>'breakfast_unit_price')::numeric,(q->>'cabin_price')::numeric,(q->>'extras_price')::numeric,(q->>'total_price')::numeric,p_breakfast,p_observations,p_request)
    returning id into result;
  return result;
end;
$$;
revoke all on function private.create_booking(uuid,date,date,integer,boolean,text,uuid) from public, anon;
grant execute on function private.create_booking(uuid,date,date,integer,boolean,text,uuid) to authenticated;
create function public.create_booking(p_cabin uuid,p_start date,p_end date,p_guests integer,p_breakfast boolean,p_observations text,p_request uuid)
returns uuid language sql security invoker set search_path = '' as $$ select private.create_booking(p_cabin,p_start,p_end,p_guests,p_breakfast,p_observations,p_request); $$;
revoke all on function public.create_booking(uuid,date,date,integer,boolean,text,uuid) from public, anon;
grant execute on function public.create_booking(uuid,date,date,integer,boolean,text,uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('cabin-images','cabin-images',true,10485760,array['image/jpeg','image/png','image/webp']),
       ('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']);
create policy cabin_images_public_read on storage.objects for select to anon, authenticated using(bucket_id='cabin-images');
create policy cabin_images_staff_manage on storage.objects for all to authenticated using(bucket_id='cabin-images' and (select private.is_staff())) with check(bucket_id='cabin-images' and (select private.is_staff()));
create policy avatars_own_read on storage.objects for select to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_own_insert on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_own_update on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_own_delete on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
