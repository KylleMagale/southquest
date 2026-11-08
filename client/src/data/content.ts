
 // All landing-page copy lives here so it is easy to edit.
 // NOTE: package/destination descriptions are placeholder copy until the
 // final wording and prices from SouthQuest are confirmed.

export type SceneKind = "camp" | "mountain" | "beach" | "waterfall" | "forest"

export const brand = {
  first: "South",
  second: "Quest",
  region: "Cebu's 2nd District",
}

export const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Packages", to: "/packages" },
  { label: "Destinations", to: "/destinations" },
  { label: "Reviews", to: "/reviews" },
  { label: "FAQs", to: "/faqs" },
  { label: "Contact", to: "/contact" },
]

export const heroBenefits = ["Gear Included", "Meals Included", "Setup Done For You", "Book Online"]

export const packages = [
  {
    id: 1,
    slug: "peak-explorer",
    name: "Peak Explorer",
    image: "/images/peak-explorer.webp",
    tagline: "Highland Adventure",
    description: "Wake up above the clouds. Hike, pitch camp and watch the sun rise over the highlands.",
    scene: "mountain" as SceneKind,
    bgColor: "from-[#84cc16]/20 via-[#84cc16]/10 to-transparent",
    accentColor: "#84cc16",
    badges: ["Camping", "Highlands", "Gear Included"],
  },
  {
    id: 2,
    slug: "coastal-breeze-glamp",
    name: "Coastal Breeze Glamp",
    image: "/images/coastal-breeze-glamp.webp",
    tagline: "Beachside Glamping",
    description: "Sea air, soft sand and a comfortable bed a few steps from the shoreline.",
    scene: "beach" as SceneKind,
    bgColor: "from-[#00d4ff]/20 via-[#00d4ff]/10 to-transparent",
    accentColor: "#00a8cc",
    badges: ["Glamping", "Beachfront", "Meals Available"],
  },
  {
    id: 3,
    slug: "mountain-ridge-deluxe",
    name: "Mountain Ridge Deluxe",
    image: "/images/mountain-ridge-deluxe.webp",
    tagline: "Elevated Comfort",
    description: "A more comfortable way up the mountain: premium setup with the view still doing the talking.",
    scene: "camp" as SceneKind,
    bgColor: "from-[#AFFF00]/20 via-[#AFFF00]/5 to-transparent",
    accentColor: "#AFFF00",
    badges: ["Deluxe", "Mountain Views", "Add-ons"],
  },
  {
    id: 4,
    slug: "forest-falls-sanctuary",
    name: "Forest & Falls Sanctuary",
    image: "/images/forest-and-falls-sanctuary.webp",
    tagline: "Waterfall Retreat",
    description: "Slow down beside the falls. Cool air, tall trees and the sound of running water.",
    scene: "waterfall" as SceneKind,
    bgColor: "from-[#f59e0b]/20 via-[#f59e0b]/10 to-transparent",
    accentColor: "#d98200",
    badges: ["Retreat", "Waterfalls", "Nature"],
  },
]

export const included = [
  {
    icon: "tent",
    title: "Gear",
    subtitle: "Equipment Provided",
    description: "Tents and camping essentials ready for you",
    accent: "#AFFF00",
  },
  {
    icon: "utensils",
    title: "Meals",
    subtitle: "Choose Your Meal Plan",
    description: "Pick the meals that suit your group",
    accent: "#FF6B35",
  },
  {
    icon: "wrench",
    title: "Setup",
    subtitle: "Done Before You Arrive",
    description: "Just show up and start enjoying",
    accent: "#00D4FF",
  },
  {
    icon: "sparkles",
    title: "Add-ons",
    subtitle: "Make It Yours",
    description: "Customize extras and see the price live",
    accent: "#AFFF00",
  },
]

export const audiences = [
  {
    icon: "heart",
    title: "Couples",
    description: "A quiet escape for two, under the stars.",
    cta: "See Packages",
  },
  {
    icon: "users",
    title: "Families",
    description: "Easy, comfortable outdoor time for everyone.",
    cta: "See Packages",
  },
  {
    icon: "graduation",
    title: "Student & Corporate Groups",
    description: "Team-building and group trips, planned in one booking.",
    cta: "Plan a Trip",
  },
  {
    icon: "leaf",
    title: "Eco-Adventurers",
    description: "Hikes, waterfalls and wild places, done responsibly.",
    cta: "Explore",
  },
]

export const destinations = [
  {
    slug: "highlands",
    name: "Highlands",
    category: "Mountain / Highland",
    note: "Cool air, ridge views, sunrise hikes",
    scene: "mountain" as SceneKind,
  },
  {
    slug: "coastline",
    name: "Coastline",
    category: "Beach / Coastal",
    note: "Beachfront camping and glamping",
    scene: "beach" as SceneKind,
  },
  {
    slug: "falls-forest",
    name: "Falls & Forest",
    category: "Waterfall / Inland",
    note: "Waterfalls, trails and shaded campsites",
    scene: "waterfall" as SceneKind,
  },
]

export const steps = [
  { title: "Pick a destination", description: "Highland, coastal or waterfall: choose where you want to wake up." },
  { title: "Choose a package", description: "Compare the four packages and find your fit." },
  { title: "Customize it", description: "Add meals and extras. The price updates as you go." },
  { title: "Check your date", description: "Set your guests and date, and see availability right away." },
  { title: "Book and get your reference", description: "Review, submit, and keep your booking reference." },
]

export const faqs = [
  {
    q: "How do I book?",
    a: "Choose a destination and package, customize your meals and add-ons, pick a date and guest count, then review and submit. You get a booking reference after you submit.",
  },
  {
    q: "Do I need an account?",
    a: "You can browse packages and build your trip without one. You only need to sign in when you review and submit your booking.",
  },
  {
    q: "Is camping gear included?",
    a: "Yes. Packages come with the gear and setup, so you can just show up and enjoy.",
  },
  {
    q: "Can I choose my date?",
    a: "Yes. We check availability for your date and package before you submit, so you know it works.",
  },
  {
    q: "Can I customize meals and extras?",
    a: "Yes. Add meal options and extras in the Package Builder, and the price updates as you choose.",
  },
  {
    q: "Where can I see my booking?",
    a: "Your booking and its status are listed on the My Booking page once you are signed in.",
  },
]

export const footerLinks = [
  {
    title: "Packages",
    links: [
      { label: "Peak Explorer", to: "/packages/peak-explorer" },
      { label: "Coastal Breeze Glamp", to: "/packages/coastal-breeze-glamp" },
      { label: "Mountain Ridge Deluxe", to: "/packages/mountain-ridge-deluxe" },
      { label: "Forest & Falls Sanctuary", to: "/packages/forest-falls-sanctuary" },
    ],
  },
  {
    title: "Destinations",
    links: [
      { label: "Highlands", to: "/destinations/highlands" },
      { label: "Coastline", to: "/destinations/coastline" },
      { label: "Falls & Forest", to: "/destinations/falls-forest" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "Home", to: "/" },
      { label: "All Packages", to: "/packages" },
      { label: "Package Builder", to: "/builder" },
      { label: "How It Works", to: "/#how" },
      { label: "FAQs", to: "/#faq" },
    ],
  },
]
