import {
  DuplicateReferenceError,
  FullyBookedError,
  type AdminBooking,
  type BookingRecord,
  type BookingStore,
  type Customer,
  type NewBooking,
} from "./bookingStore.js"
import type { Catalog } from "./app.js"
import type {
  AdminAddon,
  AdminDestination,
  AdminPackage,
  ContentStore,
  DateLimit,
} from "./contentStore.js"
import type { Addon } from "./pricing.js"
import type { Destination, Package } from "./types.js"

// Sample add-ons, only used when SAMPLE_PRICES=true and there is no Supabase. Replace with your real ones.
export const sampleAddons: Addon[] = [
  { id: 1, name: "Breakfast", type: "meal", price: 250, priceType: "per_guest" },
  { id: 2, name: "Lunch", type: "meal", price: 300, priceType: "per_guest" },
  { id: 3, name: "Dinner", type: "meal", price: 350, priceType: "per_guest" },
  { id: 4, name: "Firewood bundle", type: "extra", price: 150, priceType: "per_booking" },
  { id: 5, name: "Extra sleeping mat", type: "extra", price: 100, priceType: "per_booking" },
]

/** In-memory store: used for local sample mode and for tests. Data is lost on restart. */
export function createMemoryStore(
  initialAddons: Addon[] = [],
  customerOf: (userId: string) => Customer = () => ({ name: null, email: null, phone: null }),
  seed: { packages?: AdminPackage[]; destinations?: AdminDestination[] } = {},
): BookingStore & ContentStore {
  const bookings: (BookingRecord & { packageId: number; destinationId: number })[] = []
  const addons: AdminAddon[] = initialAddons.map((a) => ({ ...a, status: "active" }))
  const packages: AdminPackage[] = (seed.packages ?? []).map((p) => ({ ...p }))
  const destinations: AdminDestination[] = (seed.destinations ?? []).map((d) => ({ ...d }))
  const limits = new Map<string, number>()
  const limitKey = (p: number, d: number, date: string) => `${p}:${d}:${date}`
  const nextId = (list: { id: number }[]) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1

  const taken = (packageId: number, destinationId: number, date: string) =>
    bookings.filter(
      (b) =>
        b.packageId === packageId &&
        b.destinationId === destinationId &&
        b.date === date &&
        (b.status === "pending" || b.status === "confirmed"),
    ).length

  const strip = ({ packageId: _p, destinationId: _d, ...rest }: (typeof bookings)[number]): BookingRecord => rest
  const toAdmin = (b: (typeof bookings)[number]): AdminBooking => ({ ...strip(b), customer: customerOf(b.userId) })

  return {
    async listAddons() {
      return addons
        .filter((a) => a.status === "active")
        .map(({ status: _s, ...a }): Addon => a)
    },
    async availability(packageId, destinationId, date) {
      return { limit: limits.get(limitKey(packageId, destinationId, date)) ?? null, taken: taken(packageId, destinationId, date) }
    },
    async createBooking(input: NewBooking, defaultLimit: number) {
      // No awaits between the check and the insert, so this is atomic in a single Node process.
      if (bookings.some((b) => b.reference === input.reference)) throw new DuplicateReferenceError()
      const limit = limits.get(limitKey(input.packageId, input.destinationId, input.date)) ?? defaultLimit
      if (taken(input.packageId, input.destinationId, input.date) >= limit) throw new FullyBookedError()
      const record = {
        reference: input.reference,
        userId: input.userId,
        packageId: input.packageId,
        destinationId: input.destinationId,
        packageName: input.packageName,
        destinationName: input.destinationName,
        date: input.date,
        guests: input.guests,
        mealOption: input.mealOption,
        addons: input.addons.map((a) => ({ name: a.name })),
        totalPrice: input.totalPrice,
        status: "pending" as const,
        paymentStatus: "unpaid" as const,
        createdAt: new Date().toISOString(),
      }
      bookings.push(record)
      return strip(record)
    },
    async listForUser(userId) {
      return bookings
        .filter((b) => b.userId === userId)
        .map(strip)
        .reverse()
    },
    async findForUser(userId, reference) {
      const found = bookings.find((b) => b.userId === userId && b.reference === reference)
      return found ? strip(found) : null
    },

    async listAll(limit) {
      return bookings
        .map(toAdmin)
        .reverse()
        .slice(0, limit)
    },
    async findByReference(reference) {
      const found = bookings.find((b) => b.reference === reference)
      return found ? toAdmin(found) : null
    },
    async updateBooking(reference, seen, change) {
      const found = bookings.find((b) => b.reference === reference)
      if (!found || found.status !== seen.status || found.paymentStatus !== seen.paymentStatus) return null
      if (change.status) found.status = change.status
      if (change.paymentStatus) found.paymentStatus = change.paymentStatus
      return toAdmin(found)
    },

    // ---- content (admin) ----
    async listPackages() {
      return packages.map((p) => ({ ...p }))
    },
    async createPackage(slug, input) {
      const created: AdminPackage = { id: nextId(packages), slug, ...input }
      packages.push(created)
      return { ...created }
    },
    async updatePackage(id, patch) {
      const found = packages.find((p) => p.id === id)
      if (!found) return null
      Object.assign(found, patch)
      return { ...found }
    },

    async listDestinations() {
      return destinations.map((d) => ({ ...d }))
    },
    async createDestination(slug, input) {
      const created: AdminDestination = { id: nextId(destinations), slug, ...input }
      destinations.push(created)
      return { ...created }
    },
    async updateDestination(id, patch) {
      const found = destinations.find((d) => d.id === id)
      if (!found) return null
      Object.assign(found, patch)
      return { ...found }
    },

    async listAllAddons() {
      return addons.map((a) => ({ ...a }))
    },
    async createAddon(input) {
      const created: AdminAddon = { id: nextId(addons), ...input }
      addons.push(created)
      return { ...created }
    },
    async updateAddon(id, patch) {
      const found = addons.find((a) => a.id === id)
      if (!found) return null
      Object.assign(found, patch)
      return { ...found }
    },

    async listLimits(packageId, destinationId, fromDate) {
      const rows: DateLimit[] = []
      for (const [key, maxBookings] of limits) {
        const [p, d, date] = key.split(":")
        if (Number(p) === packageId && Number(d) === destinationId && date >= fromDate) rows.push({ date, maxBookings })
      }
      return rows.sort((a, b) => a.date.localeCompare(b.date))
    },
    async setLimit(packageId, destinationId, date, maxBookings) {
      limits.set(limitKey(packageId, destinationId, date), maxBookings)
    },
    async clearLimit(packageId, destinationId, date) {
      limits.delete(limitKey(packageId, destinationId, date))
    },
  }
}

/**
 * A public catalog that reads from the same in-memory store, so edits made through the admin API
 * show up on the public side too. For tests and local experiments only: the real catalog reads Supabase.
 */
export function createMemoryCatalog(store: ContentStore): Catalog {
  const build = async () => {
    const [packages, destinations] = await Promise.all([store.listPackages(), store.listDestinations()])
    const activeDestinations = destinations.filter((d) => d.status === "active")

    const destSummary = ({ id, slug, name, category, scene }: AdminDestination) => ({ id, slug, name, category, scene })
    const pkgSummary = ({ id, slug, name, tagline, scene }: AdminPackage) => ({ id, slug, name, tagline, scene })

    const pkgs: Package[] = packages
      .filter((p) => p.status === "active")
      .map((p) => ({
        ...pkgSummary(p),
        description: p.description,
        capacity: p.capacity,
        pricingType: p.pricingType,
        basePrice: p.basePrice,
        inclusions: p.inclusions,
        imageUrl: p.imageUrl,
        destinations: activeDestinations.filter((d) => p.destinationIds.includes(d.id)).map(destSummary),
      }))

    const dests: Destination[] = activeDestinations.map((d) => ({
      ...destSummary(d),
      location: d.location,
      description: d.description,
      imageUrl: d.imageUrl,
      packages: packages.filter((p) => p.status === "active" && p.destinationIds.includes(d.id)).map(pkgSummary),
    }))
    return { pkgs, dests }
  }

  return {
    listPackages: async () => (await build()).pkgs,
    getPackage: async (slug) => (await build()).pkgs.find((p) => p.slug === slug) ?? null,
    listDestinations: async () => (await build()).dests,
    getDestination: async (slug) => (await build()).dests.find((d) => d.slug === slug) ?? null,
  }
}