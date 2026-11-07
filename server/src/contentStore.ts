import type { Addon } from "./pricing.js"
import type { DestinationCategory, SceneKind } from "./types.js"

export type ContentStatus = "active" | "inactive"

/** A package as the admin sees it: every status, plus which destinations it is offered at. */
export interface AdminPackage {
  id: number
  slug: string
  name: string
  tagline: string | null
  description: string | null
  capacity: number | null
  pricingType: "per_guest" | "flat"
  basePrice: number | null
  inclusions: string[]
  imageUrl: string | null
  scene: SceneKind
  status: ContentStatus
  destinationIds: number[]
}

export interface AdminDestination {
  id: number
  slug: string
  name: string
  category: DestinationCategory
  location: string | null
  description: string | null
  imageUrl: string | null
  scene: SceneKind
  status: ContentStatus
}

export interface AdminAddon extends Addon {
  status: ContentStatus
}

/** The slug is made once when an item is created and never changes (links and photos depend on it). */
export type PackageInput = Omit<AdminPackage, "id" | "slug">
export type DestinationInput = Omit<AdminDestination, "id" | "slug">
export type AddonInput = Omit<AdminAddon, "id">

export interface DateLimit {
  date: string
  maxBookings: number
}

export interface ContentStore {
  listPackages(): Promise<AdminPackage[]>
  createPackage(slug: string, input: PackageInput): Promise<AdminPackage>
  /** Returns null when the package does not exist. */
  updatePackage(id: number, patch: Partial<PackageInput>): Promise<AdminPackage | null>

  listDestinations(): Promise<AdminDestination[]>
  createDestination(slug: string, input: DestinationInput): Promise<AdminDestination>
  updateDestination(id: number, patch: Partial<DestinationInput>): Promise<AdminDestination | null>

  listAllAddons(): Promise<AdminAddon[]>
  createAddon(input: AddonInput): Promise<AdminAddon>
  updateAddon(id: number, patch: Partial<AddonInput>): Promise<AdminAddon | null>

  /** Date-specific limits for one package + destination, from `fromDate` onwards, soonest first. */
  listLimits(packageId: number, destinationId: number, fromDate: string): Promise<DateLimit[]>
  setLimit(packageId: number, destinationId: number, date: string, maxBookings: number): Promise<void>
  clearLimit(packageId: number, destinationId: number, date: string): Promise<void>
}