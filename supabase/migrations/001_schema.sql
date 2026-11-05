
-- SouthQuest Outdoor Escapes: MVP schema
-- Run in the Supabase SQL editor (or via the Supabase CLI), then run supabase/seed.sql.

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer'
    check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Catalog
create table public.destinations (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  category text not null
    check (category in ('mountain', 'beach', 'waterfall')),
  location text,
  description text,
  image_url text,
  scene text not null default 'forest',
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.packages (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  capacity int check (capacity is null or capacity > 0),
  pricing_type text not null default 'per_guest'
    check (pricing_type in ('per_guest', 'flat')),
  base_price numeric(10, 2)
    check (base_price is null or base_price >= 0),
  inclusions text[] not null default '{}',
  image_url text,
  scene text not null default 'camp',
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.package_destinations (
  package_id bigint not null
    references public.packages (id) on delete cascade,
  destination_id bigint not null
    references public.destinations (id) on delete cascade,
  primary key (package_id, destination_id)
);

create table public.addons (
  id bigint generated always as identity primary key,
  name text not null,
  type text not null check (type in ('meal', 'extra')),
  price numeric(10, 2) not null default 0 check (price >= 0),
  status text not null default 'active'
    check (status in ('active', 'inactive'))
);

-- Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references auth.users (id) on delete restrict,
  package_id bigint not null references public.packages (id),
  destination_id bigint not null references public.destinations (id),
  booking_date date not null,
  guests int not null check (guests > 0),
  meal_option text,
  total_price numeric(10, 2) not null check (total_price >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index bookings_user_idx on public.bookings (user_id);
create index bookings_date_idx
  on public.bookings (package_id, destination_id, booking_date);

create table public.booking_addons (
  booking_id uuid not null
    references public.bookings (id) on delete cascade,
  addon_id bigint not null references public.addons (id),
  price_at_booking numeric(10, 2) not null,
  primary key (booking_id, addon_id)
);

create table public.daily_limits (
  package_id bigint not null
    references public.packages (id) on delete cascade,
  destination_id bigint not null
    references public.destinations (id) on delete cascade,
  limit_date date not null,
  max_bookings int not null check (max_bookings >= 0),
  primary key (package_id, destination_id, limit_date)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.packages enable row level security;
alter table public.package_destinations enable row level security;
alter table public.addons enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_addons enable row level security;
alter table public.daily_limits enable row level security;

-- Profiles
create policy "own profile read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "own profile update" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
  );

-- Public catalog
create policy "public read destinations" on public.destinations
  for select using (status = 'active' or public.is_admin());
create policy "admin write destinations" on public.destinations
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read packages" on public.packages
  for select using (status = 'active' or public.is_admin());
create policy "admin write packages" on public.packages
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read package_destinations"
  on public.package_destinations for select using (true);
create policy "admin write package_destinations"
  on public.package_destinations for all
  using (public.is_admin()) with check (public.is_admin());

create policy "public read addons" on public.addons
  for select using (status = 'active' or public.is_admin());
create policy "admin write addons" on public.addons
  for all using (public.is_admin()) with check (public.is_admin());

-- Bookings
create policy "own bookings read" on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());
create policy "admin update bookings" on public.bookings
  for update using (public.is_admin()) with check (public.is_admin());

create policy "own booking_addons read" on public.booking_addons
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.user_id = auth.uid() or public.is_admin())
    )
  );

-- Daily limits
create policy "public read daily_limits" on public.daily_limits
  for select using (true);
create policy "admin write daily_limits" on public.daily_limits
  for all using (public.is_admin()) with check (public.is_admin());
