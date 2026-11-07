-- This portfolio must not produce reservations that look like real business data.
alter table public.bookings alter column is_demo set default true;
