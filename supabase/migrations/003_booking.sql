
-- Booking support. Run after 001 and 002.

-- Add-on prices are either per guest (e.g. meals) or once per booking (e.g. firewood).
alter table public.addons
  add column if not exists price_type text not null default 'per_booking'
  check (price_type in ('per_guest', 'per_booking'));

-- Creates a booking only if the date still has room. The advisory lock makes two people
-- booking the last slot at the same moment safe: one succeeds, the other gets FULLY_BOOKED.
-- Called by the Express API with the service-role key; customers cannot call it directly.
create or replace function public.create_booking(
  p_reference      text,
  p_user_id        uuid,
  p_package_id     bigint,
  p_destination_id bigint,
  p_booking_date   date,
  p_guests         int,
  p_meal_option    text,
  p_total_price    numeric,
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
    (reference, user_id, package_id, destination_id, booking_date, guests, meal_option, total_price)
  values
    (p_reference, p_user_id, p_package_id, p_destination_id, p_booking_date, p_guests, p_meal_option, p_total_price)
  returning * into v_booking;

  insert into public.booking_addons (booking_id, addon_id, price_at_booking)
  select v_booking.id, a.id, a.price
  from public.addons a
  where a.id = any (p_addon_ids) and a.status = 'active';

  return v_booking;
end;
$$;

revoke all on function public.create_booking(text, uuid, bigint, bigint, date, int, text, numeric, bigint[], int)
  from public, anon, authenticated;
grant execute on function public.create_booking(text, uuid, bigint, bigint, date, int, text, numeric, bigint[], int)
  to service_role;
