
-- SAMPLE prices, capacities and add-ons so you can try the booking flow.
-- These are made-up numbers, NOT SouthQuest's real prices. Replace them (here or in the Supabase
-- table editor) with the real ones before going live. Run after 003_booking.sql and seed.sql.

update public.packages set base_price = 1200, capacity = 8 where slug = 'peak-explorer';
update public.packages set base_price = 2500, capacity = 4 where slug = 'coastal-breeze-glamp';
update public.packages set base_price = 3000, capacity = 4 where slug = 'mountain-ridge-deluxe';
update public.packages set base_price = 1800, capacity = 6 where slug = 'forest-falls-sanctuary';

delete from public.addons;
insert into public.addons (name, type, price, price_type) values
  ('Breakfast',          'meal',  250, 'per_guest'),
  ('Lunch',              'meal',  300, 'per_guest'),
  ('Dinner',             'meal',  350, 'per_guest'),
  ('Firewood bundle',    'extra', 150, 'per_booking'),
  ('Extra sleeping mat', 'extra', 100, 'per_booking');
