import { randomInt } from "node:crypto"
import cors from "cors"
import express, { type NextFunction, type Request, type RequestHandler, type Response } from "express"
import { isValidISODate, minBookableDate, todayInManila } from "./dates.js"
import {
  DuplicateReferenceError,
  FullyBookedError,
  type AdminBooking,
  type BookingChange,
  type BookingRecord,
  type BookingStore,
} from "./bookingStore.js"
import { calculatePrice, type Addon } from "./pricing.js"
import type { Destination, Package } from "./types.js"

export interface Catalog {
  listPackages(): Promise<Package[]>
  getPackage(slug: string): Promise<Package | null>
  listDestinations(): Promise<Destination[]>
  getDestination(slug: string): Promise<Destination | null>
}

export interface Deps {
  catalog: Catalog
  store: BookingStore
  requireAuth: RequestHandler
  /** Same as requireAuth, but only lets admins through (403 for everyone else). */
  requireAdmin: RequestHandler
  dataSource: string
  /** Max bookings per package + destination + date when daily_limits has no row for that date. */
  defaultDailyLimit: number
  corsOrigin?: string
  /** Injectable for tests. */
  today?: () => string
}

class BadRequest extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789" // no 0/O/1/I/L lookalikes
const newReference = () => "SQ-" + Array.from({ length: 6 }, () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]).join("")

const MAX_GUESTS = 100
const ADMIN_LIST_LIMIT = 500

const STATUSES = ["pending", "confirmed", "rejected", "cancelled"] as const
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const

// What an admin may change a booking to. Rejected and cancelled are final: the customer books again instead.
const STATUS_NEXT: Record<BookingRecord["status"], BookingRecord["status"][]> = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["cancelled"],
  rejected: [],
  cancelled: [],
}
const PAYMENT_NEXT: Record<BookingRecord["paymentStatus"], BookingRecord["paymentStatus"][]> = {
  unpaid: ["paid"],
  paid: ["unpaid", "refunded"], // "unpaid" undoes a mistake
  refunded: [],
}

/** Returns a message if the change is not allowed, otherwise null. The status change is judged first. */
export function checkChange(current: BookingRecord, change: BookingChange): string | null {
  const status = change.status ?? current.status
  if (change.status && !STATUS_NEXT[current.status].includes(change.status)) {
    return `A ${current.status} booking can't be changed to ${change.status}.`
  }
  if (change.paymentStatus && !PAYMENT_NEXT[current.paymentStatus].includes(change.paymentStatus)) {
    return `A ${current.paymentStatus} booking can't be marked ${change.paymentStatus}.`
  }
  if (change.paymentStatus === "paid" && status !== "confirmed") {
    return "Confirm the booking before marking it paid."
  }
  return null
}

export function createApp(deps: Deps) {
  const { catalog, store, requireAuth, requireAdmin } = deps
  const today = deps.today ?? todayInManila
  const app = express()

  app.use(cors({ origin: deps.corsOrigin ?? "http://localhost:5173" }))
  app.use(express.json())

  // Express 4 does not catch async errors on its own.
  const wrap =
    (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) =>
      fn(req, res).catch(next)

  // ---------- input helpers ----------
  const str = (v: unknown, name: string): string => {
    if (typeof v !== "string" || !v.trim()) throw new BadRequest(`${name} is required`)
    return v.trim()
  }
  const guestsOf = (v: unknown): number => {
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > MAX_GUESTS)
      throw new BadRequest("Guests must be a whole number of at least 1")
    return v
  }
  const addonIdsOf = (v: unknown): number[] => {
    if (v === undefined) return []
    if (!Array.isArray(v) || v.some((x) => !Number.isInteger(x) || x < 1)) throw new BadRequest("Invalid add-ons")
    return [...new Set(v as number[])]
  }
  const loadPackage = async (slug: string): Promise<Package> => {
    const pkg = await catalog.getPackage(slug)
    if (!pkg) throw new BadRequest("Unknown package", 404)
    return pkg
  }
  const loadAddons = async (ids: number[]): Promise<Addon[]> => {
    const all = await store.listAddons()
    const picked = ids.map((id) => all.find((a) => a.id === id))
    if (picked.some((a) => !a)) throw new BadRequest("One of the selected add-ons is not available")
    return picked as Addon[]
  }

  async function checkAvailability(pkg: Package, destinationSlug: string, date: string, guests: number) {
    const fail = (reason: string) => ({ available: false as const, remaining: 0, reason })
    if (!isValidISODate(date)) return fail("Please pick a valid date.")
    if (date < minBookableDate(today())) return fail("Please pick a date from tomorrow onwards.")
    const destination = pkg.destinations.find((d) => d.slug === destinationSlug)
    if (!destination) return fail("This package isn't offered at that destination.")
    if (pkg.capacity !== null && guests > pkg.capacity) return fail(`This package fits up to ${pkg.capacity} guests.`)

    const { limit, taken } = await store.availability(pkg.id, destination.id, date)
    const remaining = Math.max(0, (limit ?? deps.defaultDailyLimit) - taken)
    if (remaining === 0) return fail("Fully booked on that date. Please try another date.")
    return { available: true as const, remaining, destination }
  }

  const toDto = (b: BookingRecord) => ({
    reference: b.reference,
    status: b.status,
    paymentStatus: b.paymentStatus,
    packageName: b.packageName,
    destinationName: b.destinationName,
    date: b.date,
    guests: b.guests,
    mealOption: b.mealOption,
    addons: b.addons.map((a) => a.name),
    totalPrice: b.totalPrice,
    createdAt: b.createdAt,
  })

  // ---------- public ----------
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, dataSource: deps.dataSource })
  })

  app.get("/api/packages", wrap(async (_req, res) => void res.json(await catalog.listPackages())))

  app.get(
    "/api/packages/:slug",
    wrap(async (req, res) => {
      const item = await catalog.getPackage(req.params.slug)
      if (!item) {
        res.status(404).json({ error: "Package not found" })
        return
      }
      res.json(item)
    }),
  )

  app.get("/api/destinations", wrap(async (_req, res) => void res.json(await catalog.listDestinations())))

  app.get(
    "/api/destinations/:slug",
    wrap(async (req, res) => {
      const item = await catalog.getDestination(req.params.slug)
      if (!item) {
        res.status(404).json({ error: "Destination not found" })
        return
      }
      res.json(item)
    }),
  )

  app.get("/api/addons", wrap(async (_req, res) => void res.json(await store.listAddons())))

  const availabilityReply = async (res: Response, slug: string, destinationSlug: string, date: string, guests: number) => {
    const pkg = await loadPackage(slug)
    const result = await checkAvailability(pkg, destinationSlug, date, guests)
    res.json({ available: result.available, remaining: result.remaining, reason: "reason" in result ? result.reason : undefined })
  }

  // POST (JSON body) and GET (query string) both work; the Builder page uses GET, the Review page POST.
  app.post(
    "/api/availability/check",
    wrap((req, res) =>
      availabilityReply(res, str(req.body?.packageSlug, "packageSlug"), str(req.body?.destinationSlug, "destinationSlug"), str(req.body?.date, "date"), guestsOf(req.body?.guests)),
    ),
  )

  app.get(
    "/api/availability",
    wrap((req, res) => {
      const guests = req.query.guests === undefined ? 1 : Number(req.query.guests)
      return availabilityReply(res, str(req.query.packageSlug, "packageSlug"), str(req.query.destinationSlug, "destinationSlug"), str(req.query.date, "date"), guestsOf(guests))
    }),
  )

  app.post(
    "/api/price/calculate",
    wrap(async (req, res) => {
      const pkg = await loadPackage(str(req.body?.packageSlug, "packageSlug"))
      const guests = guestsOf(req.body?.guests)
      const addons = await loadAddons(addonIdsOf(req.body?.addonIds))
      if (pkg.basePrice === null) {
        res.json({ priceAvailable: false, reason: "Pricing for this package has not been set yet." })
        return
      }
      const { lines, total } = calculatePrice({ pricingType: pkg.pricingType, basePrice: pkg.basePrice, guests, addons })
      res.json({ priceAvailable: true, currency: "PHP", lines, total })
    }),
  )

  const toAdminDto = (b: AdminBooking) => ({ ...toDto(b), customer: b.customer })

  // ---------- signed-in ----------
  // The signed-in user's own profile (also a handy way to check a token works).
  app.get("/api/me", requireAuth, (_req, res) => {
    res.json(res.locals.user)
  })

  app.post(
    "/api/bookings",
    requireAuth,
    wrap(async (req, res) => {
      const user = res.locals.user as { id: string; role?: string }

      if (user.role === "admin") {
        throw new BadRequest(
          "Admin accounts can't make bookings. Please use a customer account.",
          403
        )
      }
      const pkg = await loadPackage(str(req.body?.packageSlug, "packageSlug"))
      const guests = guestsOf(req.body?.guests)
      const date = str(req.body?.date, "date")
      const addons = await loadAddons(addonIdsOf(req.body?.addonIds))

      if (pkg.basePrice === null) throw new BadRequest("Pricing for this package has not been set yet.", 409)
      const avail = await checkAvailability(pkg, str(req.body?.destinationSlug, "destinationSlug"), date, guests)
      if (!avail.available) throw new BadRequest(avail.reason, 409)

      // Price is always calculated here. Any price sent by the browser is ignored.
      const { total } = calculatePrice({ pricingType: pkg.pricingType, basePrice: pkg.basePrice, guests, addons })
      const meals = addons.filter((a) => a.type === "meal").map((a) => a.name)

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const booking = await store.createBooking(
            {
              reference: newReference(),
              userId: user.id,
              packageId: pkg.id,
              destinationId: avail.destination.id,
              packageName: pkg.name,
              destinationName: avail.destination.name,
              date,
              guests,
              mealOption: meals.length ? meals.join(", ") : null,
              totalPrice: total,
              addons,
            },
            deps.defaultDailyLimit,
          )
          res.status(201).json(toDto(booking))
          return
        } catch (err) {
          if (err instanceof FullyBookedError) throw new BadRequest("Fully booked on that date. Please try another date.", 409)
          if (err instanceof DuplicateReferenceError) continue // astronomically rare: pick a new reference
          throw err
        }
      }
      throw new Error("Could not generate a unique booking reference")
    }),
  )

  app.get(
    "/api/bookings/mine",
    requireAuth,
    wrap(async (_req, res) => {
      const list = await store.listForUser((res.locals.user as { id: string }).id)
      res.json(list.map(toDto))
    }),
  )

  app.get(
    "/api/bookings/:reference",
    requireAuth,
    wrap(async (req, res) => {
      const found = await store.findForUser((res.locals.user as { id: string }).id, req.params.reference)
      if (!found) {
        res.status(404).json({ error: "Booking not found" })
        return
      }
      res.json(toDto(found))
    }),
  )

  // ---------- admin ----------
  app.get(
    "/api/admin/bookings",
    requireAdmin,
    wrap(async (_req, res) => {
      const list = await store.listAll(ADMIN_LIST_LIMIT)
      res.json(list.map(toAdminDto))
    }),
  )

  app.patch(
    "/api/admin/bookings/:reference",
    requireAdmin,
    wrap(async (req, res) => {
      const change: BookingChange = {}
      const { status, paymentStatus } = req.body ?? {}
      if (status !== undefined) {
        if (!STATUSES.includes(status)) throw new BadRequest("Unknown status")
        change.status = status
      }
      if (paymentStatus !== undefined) {
        if (!PAYMENT_STATUSES.includes(paymentStatus)) throw new BadRequest("Unknown payment status")
        change.paymentStatus = paymentStatus
      }

      const current = await store.findByReference(req.params.reference)
      if (!current) throw new BadRequest("Booking not found", 404)

      // Ignore fields that already have the requested value, so a double click is harmless.
      if (change.status === current.status) delete change.status
      if (change.paymentStatus === current.paymentStatus) delete change.paymentStatus
      if (change.status === undefined && change.paymentStatus === undefined) {
        throw new BadRequest("Nothing to change")
      }

      const problem = checkChange(current, change)
      if (problem) throw new BadRequest(problem, 409)

      const updated = await store.updateBooking(
        current.reference,
        { status: current.status, paymentStatus: current.paymentStatus },
        change,
      )
      if (!updated) throw new BadRequest("This booking was just changed. Refresh the list and try again.", 409)
      res.json(toAdminDto(updated))
    }),
  )

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof BadRequest) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error(err)
    res.status(500).json({ error: "Something went wrong" })
  })

  return app
}