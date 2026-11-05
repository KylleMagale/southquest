
-- SouthQuest seed data (placeholder copy; prices and capacity intentionally left null)
-- Safe to re-run: it clears the catalog first. Do NOT run it after real bookings exist.

truncate public.package_destinations, public.packages, public.destinations restart identity cascade;

insert into public.destinations (slug, name, category, location, description, scene) values
  ('highlands',    'Highlands',      'mountain',  'Cebu''s 2nd District',
   'Cool air, ridge views and sunrise hikes. Camp above the clouds.', 'mountain'),
  ('coastline',    'Coastline',      'beach',     'Cebu''s 2nd District',
   'Beachfront camping and glamping with sea air and soft sand.', 'beach'),
  ('falls-forest', 'Falls & Forest', 'waterfall', 'Cebu''s 2nd District',
   'Waterfalls, shaded trails and quiet inland campsites.', 'waterfall');

insert into public.packages (slug, name, tagline, description, pricing_type, inclusions, scene) values
  ('peak-explorer', 'Peak Explorer', 'Highland Adventure',
   'Wake up above the clouds. Hike, pitch camp and watch the sun rise over the highlands.',
   'per_guest', array['Camping gear', 'Campsite setup', 'Meal options'], 'mountain'),
  ('coastal-breeze-glamp', 'Coastal Breeze Glamp', 'Beachside Glamping',
   'Sea air, soft sand and a comfortable bed a few steps from the shoreline.',
   'per_guest', array['Glamping tent', 'Campsite setup', 'Meal options'], 'beach'),
  ('mountain-ridge-deluxe', 'Mountain Ridge Deluxe', 'Elevated Comfort',
   'A more comfortable way up the mountain: premium setup with the view still doing the talking.',
   'per_guest', array['Premium gear', 'Campsite setup', 'Meal options', 'Add-ons'], 'camp'),
  ('forest-falls-sanctuary', 'Forest & Falls Sanctuary', 'Waterfall Retreat',
   'Slow down beside the falls. Cool air, tall trees and the sound of running water.',
   'per_guest', array['Camping gear', 'Campsite setup', 'Meal options'], 'waterfall');

-- Which packages are offered at which destinations (placeholder mapping: edit to match the SRS)
insert into public.package_destinations (package_id, destination_id)
select p.id, d.id from public.packages p, public.destinations d
where (p.slug, d.slug) in (
  ('peak-explorer', 'highlands'),
  ('mountain-ridge-deluxe', 'highlands'),
  ('coastal-breeze-glamp', 'coastline'),
  ('forest-falls-sanctuary', 'falls-forest')
);
