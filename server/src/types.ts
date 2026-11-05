
export type SceneKind = "camp" | "mountain" | "beach" | "waterfall" | "forest"
export type DestinationCategory = "mountain" | "beach" | "waterfall"

export interface DestinationSummary {
  id: number
  slug: string
  name: string
  category: DestinationCategory
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
