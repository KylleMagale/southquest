
import express from "express"
import cors from "cors"
import type { RequestHandler } from "express"
import { calculatePrice } from "./pricing.js"
import { isValidDate, isTodayOrFuture } from "./dates.js"
import type { BookingStore } from "./bookingStore.js"
import type { Destination, Package } from "./types.js"

export interface Catalog {
  listPackages(): Promise<Package[]>
  getPackage(slug: string): Promise<Package | null>
  listDestinations(): Promise<Destination[]>
  getDestination(slug: string): Promise<Destination | null>
}

interface AppOptions {
  catalog: Catalog
  store: BookingStore
  requireAuth?: RequestHandler
  dataSource?: string
  defaultDailyLimit?: number
  today?: () => string
}

export function createApp(options: AppOptions) {
  const app = express()
  const {
    catalog,
    store,
    dataSource = "local-sample-data",
    today = () => new Date().toISOString().slice(0, 10),
  } = options

  app.use(cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  }))
  app.use(express.json())

  const auth = options.requireAuth ?? ((_req, res) => {
    res.status(503).json({
      error: "Authentication is not configured",
    })
  })

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, dataSource })
  })

  app.get("/api/packages", async (_req, res, next) => {
    try {
      res.json(await catalog.listPackages())
    } catch (error) {
      next(error)
    }
  })

  app.get("/api/packages/:slug", async (req, res, next) => {
    try {
      const pkg = await catalog.getPackage(req.params.slug)
      if (!pkg) {
        res.status(404).json({ error: "Package not found" })
        return
      }
      res.json(pkg)
    } catch (error) {
      next(error)
    }
  })

  app.get("/api/destinations", async (_req, res, next) => {
    try {
      res.json(await catalog.listDestinations())
    } catch (error) {
      next(error)
    }
  })

  app.get("/api/destinations/:slug", async (req, res, next) => {
    try {
      const destination = await catalog.getDestination(req.params.slug)
      if (!destination) {
        res.status(404).json({ error: "Destination not found" })
        return
      }
      res.json(destination)
    } catch (error) {
      next(error)
    }
  })

  app.get("/api/addons", async (_req, res, next) => {
    try {
      res.json(await store.listAddons())
    } catch (error) {
      next(error)
    }
  })

  app.post("/api/price/calculate", async (req, res, next) => {
    try {
      const { packageSlug, guests, addonIds = [] } = req.body ?? {}

      if (
        typeof packageSlug !== "string" ||
        !Number.isInteger(guests) ||
        guests < 1 ||
        !Array.isArray(addonIds) ||
        !addonIds.every((id: unknown) => Number.isInteger(id))
      ) {
        res.status(400).json({ error: "Invalid price request" })
        return
      }

      const pkg = await catalog.getPackage(packageSlug)
      if (!pkg) {
        res.status(404).json({ error: "Package not found" })
        return
      }

      if (pkg.basePrice === null) {
        res.json({
          priceAvailable: false,
          total: null,
          lines: [],
        })
        return
      }

      const allAddons = await store.listAddons()
      const selectedAddons = allAddons.filter((addon) =>
        addonIds.includes(addon.id),
      )

      if (selectedAddons.length !== new Set(addonIds).size) {
        res.status(400).json({ error: "One or more add-ons are unavailable" })
        return
      }

      const price = calculatePrice({
        pricingType: pkg.pricingType,
        basePrice: pkg.basePrice,
        guests,
        addons: selectedAddons,
      })

      res.json({ priceAvailable: true, ...price })
    } catch (error) {
      next(error)
    }
  })

  app.get("/api/availability", async (req, res, next) => {
    try {
      const packageSlug = String(req.query.packageSlug ?? "")
      const destinationSlug = String(req.query.destinationSlug ?? "")
      const date = String(req.query.date ?? "")

      if (!isValidDate(date) || !isTodayOrFuture(date)) {
        res.status(400).json({ error: "Choose a valid current or future date" })
        return
      }

      const pkg = await catalog.getPackage(packageSlug)
      const destination = pkg?.destinations.find(
        (item) => item.slug === destinationSlug,
      )

      if (!pkg || !destination) {
        res.status(404).json({ error: "Package or destination not found" })
        return
      }

      const availability = await store.checkAvailability({
        packageId: pkg.id,
        destinationId: destination.id,
        date,
      })

      res.json(availability)
    } catch (error) {
      next(error)
    }
  })

  app.post("/api/bookings", auth, async (req, res, next) => {
    try {
      const {
        packageSlug,
        destinationSlug,
        date,
        guests,
        addonIds = [],
      } = req.body ?? {}

      const user = res.locals.user as { id: string } | undefined

      if (!user?.id) {
        res.status(401).json({ error: "Sign in required" })
        return
      }

      if (
        typeof packageSlug !== "string" ||
        typeof destinationSlug !== "string" ||
        typeof date !== "string" ||
        !isValidDate(date) ||
        date < today() ||
        !Number.isInteger(guests) ||
        guests < 1 ||
        !Array.isArray(addonIds) ||
        !addonIds.every((id: unknown) => Number.isInteger(id))
      ) {
        res.status(400).json({ error: "Invalid booking details" })
        return
      }

      const pkg = await catalog.getPackage(packageSlug)
      const destination = pkg?.destinations.find(
        (item) => item.slug === destinationSlug,
      )

      if (!pkg || !destination) {
        res.status(404).json({ error: "Package or destination not found" })
        return
      }

      if (pkg.capacity !== null && guests > pkg.capacity) {
        res.status(400).json({ error: "Guest count exceeds package capacity" })
        return
      }

      if (pkg.basePrice === null) {
        res.status(400).json({ error: "This package is not currently priced" })
        return
      }

      const allAddons = await store.listAddons()
      const selectedAddons = allAddons.filter((addon) =>
        addonIds.includes(addon.id),
      )

      if (selectedAddons.length !== new Set(addonIds).size) {
        res.status(400).json({ error: "One or more add-ons are unavailable" })
        return
      }

      const price = calculatePrice({
        pricingType: pkg.pricingType,
        basePrice: pkg.basePrice,
        guests,
        addons: selectedAddons,
      })

      const booking = await store.createBooking({
        userId: user.id,
        packageId: pkg.id,
        destinationId: destination.id,
        bookingDate: date,
        guests,
        addonIds,
        totalPrice: price.total,
        priceBreakdown: price,
      })

      res.status(201).json(booking)
    } catch (error) {
      next(error)
    }
  })

  app.get("/api/bookings/mine", auth, async (_req, res, next) => {
    try {
      const user = res.locals.user as { id: string } | undefined
      if (!user?.id) {
        res.status(401).json({ error: "Sign in required" })
        return
      }

      res.json(await store.listBookingsForUser(user.id))
    } catch (error) {
      next(error)
    }
  })

  app.use((
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message = error instanceof Error ? error.message : "Unexpected server error"
    console.error(error)
    res.status(500).json({ error: message })
  })

  return app
}
