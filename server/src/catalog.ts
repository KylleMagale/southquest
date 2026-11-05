
import { supabase } from "./supabase.js"
import { localDestinations, localPackages } from "./localData.js"
import type { Destination, DestinationSummary, Package, PackageSummary, SceneKind } from "./types.js"

export const dataSource = supabase ? "supabase" : "local-sample-data"

/* eslint-disable @typescript-eslint/no-explicit-any */
const toDestSummary = (d: any): DestinationSummary => ({
  id: d.id,
  slug: d.slug,
  name: d.name,
  category: d.category,
  scene: d.scene as SceneKind,
})

const toPkgSummary = (p: any): PackageSummary => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  tagline: p.tagline,
  scene: p.scene as SceneKind,
})

const toPackage = (row: any): Package => ({
  ...toPkgSummary(row),
  description: row.description,
  capacity: row.capacity,
  pricingType: row.pricing_type,
  basePrice: row.base_price === null ? null : Number(row.base_price),
  inclusions: row.inclusions ?? [],
  imageUrl: row.image_url,
  destinations: (row.package_destinations ?? [])
    .map((pd: any) => pd.destinations)
    .filter((d: any) => d && d.status === "active")
    .map(toDestSummary),
})

const toDestination = (row: any): Destination => ({
  ...toDestSummary(row),
  location: row.location,
  description: row.description,
  imageUrl: row.image_url,
  packages: (row.package_destinations ?? [])
    .map((pd: any) => pd.packages)
    .filter((p: any) => p && p.status === "active")
    .map(toPkgSummary),
})

const PACKAGE_SELECT = "*, package_destinations(destinations(id, slug, name, category, scene, status))"
const DESTINATION_SELECT = "*, package_destinations(packages(id, slug, name, tagline, scene, status))"

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export async function listPackages(): Promise<Package[]> {
  if (!supabase) return localPackages
  const rows = check(await supabase.from("packages").select(PACKAGE_SELECT).eq("status", "active").order("id"))
  return (rows as any[]).map(toPackage)
}

export async function getPackage(slug: string): Promise<Package | null> {
  if (!supabase) return localPackages.find((p) => p.slug === slug) ?? null
  const row = check(
    await supabase.from("packages").select(PACKAGE_SELECT).eq("slug", slug).eq("status", "active").maybeSingle(),
  )
  return row ? toPackage(row) : null
}

export async function listDestinations(): Promise<Destination[]> {
  if (!supabase) return localDestinations
  const rows = check(await supabase.from("destinations").select(DESTINATION_SELECT).eq("status", "active").order("id"))
  return (rows as any[]).map(toDestination)
}

export async function getDestination(slug: string): Promise<Destination | null> {
  if (!supabase) return localDestinations.find((d) => d.slug === slug) ?? null
  const row = check(
    await supabase
      .from("destinations")
      .select(DESTINATION_SELECT)
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle(),
  )
  return row ? toDestination(row) : null
}
