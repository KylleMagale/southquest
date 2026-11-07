
import type { SceneKind } from "../data/content"
import { peso } from "./format"

export interface DestinationSummary {
  id: number
  slug: string
  name: string
  category: "mountain" | "beach" | "waterfall"
  scene: SceneKind
}

export interface PackageSummary {
  id: number
  slug: string
  name: string
  tagline: string | null
  scene: SceneKind
}

export interface Package extends PackageSummary {
  description: string | null
  capacity: number | null
  pricingType: "per_guest" | "flat"
  basePrice: number | null
  inclusions: string[]
  imageUrl: string | null
  destinations: DestinationSummary[]
}

export interface Destination extends DestinationSummary {
  location: string | null
  description: string | null
  imageUrl: string | null
  packages: PackageSummary[]
}

export const categoryLabel: Record<DestinationSummary["category"], string> = {
  mountain: "Mountain / Highland",
  beach: "Beach / Coastal",
  waterfall: "Waterfall / Inland",
}

export function priceLabel(p: Pick<Package, "basePrice" | "pricingType">): string {
  if (p.basePrice === null) return "Pricing coming soon"
  const amount = peso(p.basePrice)
  return p.pricingType === "per_guest" ? `${amount} per guest` : amount
}

// ---- booking ----
export interface Addon {
  id: number
  name: string
  type: "meal" | "extra"
  price: number
  priceType: "per_guest" | "per_booking"
}

export interface PriceLine {
  label: string
  quantity: number
  unitPrice: number
  total: number
}

export type PriceQuote =
  | { priceAvailable: false; reason: string }
  | { priceAvailable: true; currency: "PHP"; lines: PriceLine[]; total: number }

export interface Availability {
  available: boolean
  remaining: number
  reason?: string
}

export interface Booking {
  reference: string
  status: "pending" | "confirmed" | "rejected" | "cancelled"
  paymentStatus: "unpaid" | "paid" | "refunded"
  packageName: string
  destinationName: string
  date: string
  guests: number
  mealOption: string | null
  addons: string[]
  totalPrice: number
  createdAt: string
}

/** What the admin API returns: a booking plus who made it. */
export interface AdminBooking extends Booking {
  customer: {
    name: string | null
    email: string | null
    phone: string | null
  }
}


// ---- admin: content ----
export type ContentStatus = "active" | "inactive"

export interface AdminPackage extends Omit<Package, "destinations"> {
  status: ContentStatus
  destinationIds: number[]
}

export interface AdminDestination extends Omit<Destination, "packages"> {
  status: ContentStatus
}

export interface AdminAddon extends Addon {
  status: ContentStatus
}

export interface DateLimitRow {
  date: string
  maxBookings: number
  /** Pending + confirmed bookings already on that date. */
  taken: number
}

export interface LimitsReply {
  defaultLimit: number
  limits: DateLimitRow[]
}
