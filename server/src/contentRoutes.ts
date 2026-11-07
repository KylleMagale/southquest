import { Router, type Request, type RequestHandler, type Response } from "express"
import type { BookingStore } from "./bookingStore.js"
import type {
  AddonInput,
  ContentStatus,
  ContentStore,
  DestinationInput,
  PackageInput,
} from "./contentStore.js"
import { isValidISODate } from "./dates.js"
import { BadRequest } from "./errors.js"

const CATEGORIES = ["mountain", "beach", "waterfall"] as const
const SCENES = ["camp", "mountain", "beach", "waterfall", "forest"] as const
const STATUSES = ["active", "inactive"] as const
const PRICING = ["per_guest", "flat"] as const
const ADDON_TYPES = ["meal", "extra"] as const
const ADDON_PRICING = ["per_guest", "per_booking"] as const

const MAX_PRICE = 1_000_000
const MAX_CAPACITY = 100
const MAX_DAILY_LIMIT = 100
const MAX_LIMIT_ROWS = 120

type Body = Record<string, unknown>

// ---------- small validators (each one returns a clean value or throws a clear message) ----------
const has = (b: Body, key: string) => b[key] !== undefined

function text(b: Body, key: string, label: string, max: number, required: boolean): string | null {
  const v = b[key]
  if (v === null || v === undefined || (typeof v === "string" && !v.trim())) {
    if (required) throw new BadRequest(`${label} is required`)
    return null
  }
  if (typeof v !== "string") throw new BadRequest(`${label} must be text`)
  const t = v.trim()
  if (t.length > max) throw new BadRequest(`${label} must be ${max} characters or fewer`)
  return t
}

function pick<T extends string>(b: Body, key: string, label: string, allowed: readonly T[]): T {
  const v = b[key]
  if (typeof v !== "string" || !allowed.includes(v as T)) throw new BadRequest(`${label} is not valid`)
  return v as T
}

function imageUrl(b: Body): string | null {
  const v = text(b, "imageUrl", "Photo link", 500, false)
  if (v === null) return null
  // A full web link, or a file inside the website's public folder (starts with one "/").
  if (!/^(https?:\/\/\S+|\/(?!\/)\S*)$/.test(v)) {
    throw new BadRequest("Photo link must start with https:// or with / (for example /images/my-photo.webp)")
  }
  return v
}

function money(v: unknown, label: string, nullable: boolean): number | null {
  if (v === null || v === "" || v === undefined) {
    if (nullable) return null
    throw new BadRequest(`${label} is required`)
  }
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > MAX_PRICE) {
    throw new BadRequest(`${label} must be a number from 0 to ${MAX_PRICE.toLocaleString("en-PH")}`)
  }
  return Math.round(v * 100) / 100
}

function wholeNumber(v: unknown, label: string, min: number, max: number): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) {
    throw new BadRequest(`${label} must be a whole number from ${min} to ${max}`)
  }
  return v
}

function idOf(v: unknown, label: string): number {
  const n = typeof v === "string" ? Number(v) : v
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) throw new BadRequest(`${label} is not valid`)
  return n
}

function inclusions(v: unknown): string[] {
  if (!Array.isArray(v)) throw new BadRequest("Inclusions must be a list")
  const items = v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
  if (items.length > 20) throw new BadRequest("Add at most 20 inclusions")
  if (items.some((x) => x.length > 60)) throw new BadRequest("Each inclusion must be 60 characters or fewer")
  return items
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "item"

function uniqueSlug(name: string, taken: string[]): string {
  const base = slugify(name)
  if (!taken.includes(base)) return base
  for (let i = 2; ; i++) if (!taken.includes(`${base}-${i}`)) return `${base}-${i}`
}

// ---------- parsing a whole request body ----------
/** `partial` = a PATCH: only the fields that were sent are checked and returned. */
function parsePackage(b: Body, partial: boolean, knownDestinationIds: number[]): Partial<PackageInput> {
  const out: Partial<PackageInput> = {}
  const want = (key: string) => !partial || has(b, key)

  if (want("name")) out.name = text(b, "name", "Name", 80, true)!
  if (want("tagline")) out.tagline = text(b, "tagline", "Tagline", 80, false)
  if (want("description")) out.description = text(b, "description", "Description", 1500, false)
  if (want("capacity")) {
    out.capacity = b.capacity === null || b.capacity === "" || b.capacity === undefined
      ? null
      : wholeNumber(b.capacity, "Max guests", 1, MAX_CAPACITY)
  }
  if (want("pricingType")) out.pricingType = pick(b, "pricingType", "Pricing type", PRICING)
  if (want("basePrice")) out.basePrice = money(b.basePrice, "Price", true)
  if (want("inclusions")) out.inclusions = inclusions(b.inclusions ?? [])
  if (want("imageUrl")) out.imageUrl = imageUrl(b)
  if (want("scene")) out.scene = pick(b, "scene", "Picture style", SCENES)
  if (want("status")) out.status = pick(b, "status", "Status", STATUSES)
  if (want("destinationIds")) {
    if (!Array.isArray(b.destinationIds)) throw new BadRequest("Destinations must be a list")
    const ids = [...new Set(b.destinationIds.map((x) => idOf(x, "Destination")))]
    if (ids.some((id) => !knownDestinationIds.includes(id))) throw new BadRequest("One of the destinations doesn't exist")
    out.destinationIds = ids
  }
  return out
}

function parseDestination(b: Body, partial: boolean): Partial<DestinationInput> {
  const out: Partial<DestinationInput> = {}
  const want = (key: string) => !partial || has(b, key)

  if (want("name")) out.name = text(b, "name", "Name", 80, true)!
  if (want("category")) out.category = pick(b, "category", "Category", CATEGORIES)
  if (want("location")) out.location = text(b, "location", "Location", 120, false)
  if (want("description")) out.description = text(b, "description", "Description", 1500, false)
  if (want("imageUrl")) out.imageUrl = imageUrl(b)
  if (want("scene")) out.scene = pick(b, "scene", "Picture style", SCENES)
  if (want("status")) out.status = pick(b, "status", "Status", STATUSES)
  return out
}

function parseAddon(b: Body, partial: boolean): Partial<AddonInput> {
  const out: Partial<AddonInput> = {}
  const want = (key: string) => !partial || has(b, key)

  if (want("name")) out.name = text(b, "name", "Name", 60, true)!
  if (want("type")) out.type = pick(b, "type", "Type", ADDON_TYPES)
  if (want("price")) out.price = money(b.price, "Price", false)!
  if (want("priceType")) out.priceType = pick(b, "priceType", "Price is charged", ADDON_PRICING)
  if (want("status")) out.status = pick(b, "status", "Status", STATUSES)
  return out
}

const emptyPatch = (o: object) => {
  if (Object.keys(o).length === 0) throw new BadRequest("Nothing to change")
}

interface Options {
  content: ContentStore
  /** Used to count how many bookings already sit on a date. */
  bookings: BookingStore
  requireAdmin: RequestHandler
  defaultDailyLimit: number
  today: () => string
}

/** Everything an admin can edit besides bookings. Mounted at /api/admin. */
export function contentRouter({ content, bookings, requireAdmin, defaultDailyLimit, today }: Options) {
  const router = Router()
  router.use(requireAdmin)

  const wrap =
    (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) =>
      fn(req, res).catch(next)

  const bodyOf = (req: Request): Body => {
    const b = req.body
    if (!b || typeof b !== "object" || Array.isArray(b)) throw new BadRequest("Send the details as JSON")
    return b as Body
  }

  // ---------- packages ----------
  router.get("/packages", wrap(async (_req, res) => void res.json(await content.listPackages())))

  router.post(
    "/packages",
    wrap(async (req, res) => {
      const b = bodyOf(req)
      const destinations = await content.listDestinations()
      const parsed = parsePackage(
        { pricingType: "per_guest", scene: "camp", status: "active", inclusions: [], destinationIds: [], ...b },
        false,
        destinations.map((d) => d.id),
      ) as PackageInput

      const slug = uniqueSlug(parsed.name, (await content.listPackages()).map((p) => p.slug))
      res.status(201).json(await content.createPackage(slug, parsed))
    }),
  )

  router.patch(
    "/packages/:id",
    wrap(async (req, res) => {
      const destinations = await content.listDestinations()
      const patch = parsePackage(bodyOf(req), true, destinations.map((d) => d.id))
      emptyPatch(patch)
      const updated = await content.updatePackage(idOf(req.params.id, "Package"), patch)
      if (!updated) throw new BadRequest("Package not found", 404)
      res.json(updated)
    }),
  )

  // ---------- destinations ----------
  router.get("/destinations", wrap(async (_req, res) => void res.json(await content.listDestinations())))

  router.post(
    "/destinations",
    wrap(async (req, res) => {
      const parsed = parseDestination({ scene: "forest", status: "active", ...bodyOf(req) }, false) as DestinationInput
      const slug = uniqueSlug(parsed.name, (await content.listDestinations()).map((d) => d.slug))
      res.status(201).json(await content.createDestination(slug, parsed))
    }),
  )

  router.patch(
    "/destinations/:id",
    wrap(async (req, res) => {
      const patch = parseDestination(bodyOf(req), true)
      emptyPatch(patch)
      const updated = await content.updateDestination(idOf(req.params.id, "Destination"), patch)
      if (!updated) throw new BadRequest("Destination not found", 404)
      res.json(updated)
    }),
  )

  // ---------- add-ons ----------
  router.get("/addons", wrap(async (_req, res) => void res.json(await content.listAllAddons())))

  router.post(
    "/addons",
    wrap(async (req, res) => {
      const parsed = parseAddon({ status: "active", priceType: "per_booking", ...bodyOf(req) }, false) as AddonInput
      res.status(201).json(await content.createAddon(parsed))
    }),
  )

  router.patch(
    "/addons/:id",
    wrap(async (req, res) => {
      const patch = parseAddon(bodyOf(req), true)
      emptyPatch(patch)
      const updated = await content.updateAddon(idOf(req.params.id, "Add-on"), patch)
      if (!updated) throw new BadRequest("Add-on not found", 404)
      res.json(updated)
    }),
  )

  // ---------- daily limits ----------
  const pairOf = async (packageId: number, destinationId: number) => {
    const pkg = (await content.listPackages()).find((p) => p.id === packageId)
    if (!pkg) throw new BadRequest("Package not found", 404)
    if (!pkg.destinationIds.includes(destinationId)) {
      throw new BadRequest("This package isn't offered at that destination", 400)
    }
  }

  router.get(
    "/limits",
    wrap(async (req, res) => {
      const packageId = idOf(req.query.packageId, "Package")
      const destinationId = idOf(req.query.destinationId, "Destination")
      await pairOf(packageId, destinationId)

      const rows = (await content.listLimits(packageId, destinationId, today())).slice(0, MAX_LIMIT_ROWS)
      const limits = await Promise.all(
        rows.map(async (r) => ({
          ...r,
          taken: (await bookings.availability(packageId, destinationId, r.date)).taken,
        })),
      )
      res.json({ defaultLimit: defaultDailyLimit, limits })
    }),
  )

  router.put(
    "/limits",
    wrap(async (req, res) => {
      const b = bodyOf(req)
      const packageId = idOf(b.packageId, "Package")
      const destinationId = idOf(b.destinationId, "Destination")
      await pairOf(packageId, destinationId)

      if (typeof b.date !== "string" || !isValidISODate(b.date)) throw new BadRequest("Pick a valid date")
      if (b.date < today()) throw new BadRequest("Pick today or a later date")
      const maxBookings = wholeNumber(b.maxBookings, "Max bookings", 0, MAX_DAILY_LIMIT)

      await content.setLimit(packageId, destinationId, b.date, maxBookings)
      const taken = (await bookings.availability(packageId, destinationId, b.date)).taken
      res.json({ date: b.date, maxBookings, taken })
    }),
  )

  router.delete(
    "/limits",
    wrap(async (req, res) => {
      const packageId = idOf(req.query.packageId, "Package")
      const destinationId = idOf(req.query.destinationId, "Destination")
      const date = req.query.date
      if (typeof date !== "string" || !isValidISODate(date)) throw new BadRequest("Pick a valid date")
      await content.clearLimit(packageId, destinationId, date)
      res.json({ ok: true })
    }),
  )

  return router
}

export type { ContentStatus }