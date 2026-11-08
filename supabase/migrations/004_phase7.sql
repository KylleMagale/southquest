-- Phase 7: demo payment method, contact inquiries and reviews. Run after 001, 002 and 003.

-- ---------- payment method on bookings ----------
alter table public.bookings
  add column if not exists payment_method text
  check (payment_method in ('gcash', 'card', 'cash'));

-- Replace create_booking so it also stores the payment method and starting payment status.
drop function if exists public.create_booking(text, uuid, bigint, bigint, date, int, text, numeric, bigint[], int);

create or replace function public.create_booking(
  p_reference      text,
  p_user_id        uuid,
  p_package_id     bigint,
  p_destination_id bigint,
  p_booking_date   date,
  p_guests         int,
  p_meal_option    text,
  p_total_price    numeric,
  p_payment_method text,
  p_payment_status text,
  p_addon_ids      bigint[],
  p_default_limit  int
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_limit   int;
  v_taken   int;
  v_booking public.bookings;
begin
  perform pg_advisory_xact_lock(
    hashtext(p_package_id::text || ':' || p_destination_id::text || ':' || p_booking_date::text)
  );

  select max_bookings into v_limit
  from public.daily_limits
  where package_id = p_package_id and destination_id = p_destination_id and limit_date = p_booking_date;
  if v_limit is null then
    v_limit := p_default_limit;
  end if;

  select count(*) into v_taken
  from public.bookings
  where package_id = p_package_id and destination_id = p_destination_id
    and booking_date = p_booking_date and status in ('pending', 'confirmed');

  if v_taken >= v_limit then
    raise exception 'FULLY_BOOKED';
  end if;

  insert into public.bookings
    (reference, user_id, package_id, destination_id, booking_date, guests, meal_option, total_price,
     payment_method, payment_status)
  values
    (p_reference, p_user_id, p_package_id, p_destination_id, p_booking_date, p_guests, p_meal_option, p_total_price,
     p_payment_method, p_payment_status)
  returning * into v_booking;

  insert into public.booking_addons (booking_id, addon_id, price_at_booking)
  select v_booking.id, a.id, a.price
  from public.addons a
  where a.id = any (p_addon_ids) and a.status = 'active';

  return v_booking;
end;
$$;

revoke all on function public.create_booking(text, uuid, bigint, bigint, date, int, text, numeric, text, text, bigint[], int)
  from public, anon, authenticated;
grant execute on function public.create_booking(text, uuid, bigint, bigint, date, int, text, numeric, text, text, bigint[], int)
  to service_role;

-- ---------- contact inquiries ----------
-- Only the Express server (service-role key) reads or writes these. No public policies on purpose.
create table if not exists public.inquiries (
  id         bigint generated always as identity primary key,
  name       text not null,
  email      text not null,
  phone      text,
  message    text not null,
  status     text not null default 'new' check (status in ('new', 'read')),
  created_at timestamptz not null default now()
);
alter table public.inquiries enable row level security;

-- ---------- reviews ----------
create table if not exists public.reviews (
  id         bigint generated always as identity primary key,
  booking_id uuid   not null unique references public.bookings (id) on delete cascade,
  user_id    uuid   not null references auth.users (id) on delete cascade,
  rating     int    not null check (rating between 1 and 5),
  comment    text   not null,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now()
);
create index if not exists reviews_status_idx on public.reviews (status, created_at desc);
alter table public.reviews enable row level security;