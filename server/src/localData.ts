
import type { Destination, Package } from "./types.js"

// Local sample data used when Supabase is not configured.
// Keep in sync with supabase/seed.sql.
const dest = {
  highlands: { id: 1, slug: "highlands", name: "Highlands", category: "mountain", scene: "mountain" },
  coastline: { id: 2, slug: "coastline", name: "Coastline", category: "beach", scene: "beach" },
  falls: { id: 3, slug: "falls-forest", name: "Falls & Forest", category: "waterfall", scene: "waterfall" },
} as const

const pkg = {
  peak: { id: 1, slug: "peak-explorer", name: "Peak Explorer", tagline: "Highland Adventure", scene: "mountain" },
  coastal: {
    id: 2,
    slug: "coastal-breeze-glamp",
    name: "Coastal Breeze Glamp",
    tagline: "Beachside Glamping",
    scene: "beach",
  },
  ridge: {
    id: 3,
    slug: "mountain-ridge-deluxe",
    name: "Mountain Ridge Deluxe",
    tagline: "Elevated Comfort",
    scene: "camp",
  },
  falls: {
    id: 4,
    slug: "forest-falls-sanctuary",
    name: "Forest & Falls Sanctuary",
    tagline: "Waterfall Retreat",
    scene: "waterfall",
  },
} as const

const base = { capacity: null, pricingType: "per_guest", basePrice: null, imageUrl: null } as const

const basePackages: Package[] = [
  {
    ...pkg.peak,
    ...base,
    description: "Wake up above the clouds. Hike, pitch camp and watch the sun rise over the highlands.",
    inclusions: ["Camping gear", "Campsite setup", "Meal options"],
    destinations: [dest.highlands],
  },
  {
    ...pkg.coastal,
    ...base,
    description: "Sea air, soft sand and a comfortable bed a few steps from the shoreline.",
    inclusions: ["Glamping tent", "Campsite setup", "Meal options"],
    destinations: [dest.coastline],
  },
  {
    ...pkg.ridge,
    ...base,
    description: "A more comfortable way up the mountain: premium setup with the view still doing the talking.",
    inclusions: ["Premium gear", "Campsite setup", "Meal options", "Add-ons"],
    destinations: [dest.highlands],
  },
  {
    ...pkg.falls,
    ...base,
    description: "Slow down beside the falls. Cool air, tall trees and the sound of running water.",
    inclusions: ["Camping gear", "Campsite setup", "Meal options"],
    destinations: [dest.falls],
  },
]

const destBase = { location: "Cebu's 2nd District", imageUrl: null } as const

export const localDestinations: Destination[] = [
  {
    ...dest.highlands,
    ...destBase,
    description: "Cool air, ridge views and sunrise hikes. Camp above the clouds.",
    packages: [pkg.peak, pkg.ridge],
  },
  {
    ...dest.coastline,
    ...destBase,
    description: "Beachfront camping and glamping with sea air and soft sand.",
    packages: [pkg.coastal],
  },
  {
    ...dest.falls,
    ...destBase,
    description: "Waterfalls, shaded trails and quiet inland campsites.",
    packages: [pkg.falls],
  },
]

// SAMPLE_PRICES=true fills in made-up prices and capacities so the booking flow can be tried
// without a database. These are NOT real SouthQuest prices. Real values live in Supabase.
const samplePricing: Record<string, { basePrice: number; capacity: number }> = {
  "peak-explorer": { basePrice: 1200, capacity: 8 },
  "coastal-breeze-glamp": { basePrice: 2500, capacity: 4 },
  "mountain-ridge-deluxe": { basePrice: 3000, capacity: 4 },
  "forest-falls-sanctuary": { basePrice: 1800, capacity: 6 },
}

export const localPackages: Package[] =
  process.env.SAMPLE_PRICES === "true"
    ? basePackages.map((p) => ({ ...p, ...samplePricing[p.slug] }))
    : basePackages
