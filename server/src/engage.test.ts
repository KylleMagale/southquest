import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import type { AddressInfo } from "node:net"
import type { Server } from "node:http"
import { createApp } from "./app.js"
import { createMemoryCatalog, createMemoryStore } from "./memoryStore.js"

const TODAY = "2030-06-10"
const PAST = "2030-06-09" // not bookable, so these bookings are created directly in the store
const FUTURE = "2030-06-20"

describe("payments, inquiries and reviews", () => {
  let server: Server
  let url: string
  let store: ReturnType<typeof createMemoryStore>
  let early = false

  before(() => {
    store = createMemoryStore(
      [],
      (id) => ({ name: id === "ana" ? "Ana Reyes" : null, email: null, phone: null }),
      {
        destinations: [
          { id: 1, slug: "highlands", name: "Highlands", category: "mountain", location: null, description: null, imageUrl: null, scene: "mountain", status: "active" },
        ],
        packages: [
          { id: 1, slug: "peak", name: "Peak", tagline: null, description: null, capacity: 4, pricingType: "per_guest", basePrice: 1000, inclusions: [], imageUrl: null, scene: "camp", status: "active", destinationIds: [1] },
        ],
      },
    )
    const tokenOf = (h: string | undefined) => (h ?? "").replace("Bearer ", "")
    const app = createApp({
      catalog: createMemoryCatalog(store),
      store,
      content: store,
      engage: store,
      get allowEarlyReviews() {
        return early
      },
      requireAuth: (req, res, next) => {
        const t = tokenOf(req.headers.authorization)
        if (!t) return void res.status(401).json({ error: "Sign in required" })
        res.locals.user = { id: t, role: t.startsWith("admin") ? "admin" : "customer" }
        next()
      },
      requireAdmin: (req, res, next) => {
        const t = tokenOf(req.headers.authorization)
        if (!t) return void res.status(401).json({ error: "Sign in required" })
        if (!t.startsWith("admin")) return void res.status(403).json({ error: "Admins only" })
        res.locals.user = { id: t, role: "admin" }
        next()
      },
      dataSource: "test",
      defaultDailyLimit: 5,
      today: () => TODAY,
    })
    server = app.listen(0)
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  after(() => void server.close())

  const call = (method: string, path: string, body?: unknown, user?: string) =>
    fetch(url + path, {
      method,
      headers: { "content-type": "application/json", ...(user ? { authorization: `Bearer ${user}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  const json = async (res: Response) => (await res.json()) as any
  const trip = (over: Record<string, unknown> = {}) => ({
    packageSlug: "peak",
    destinationSlug: "highlands",
    date: FUTURE,
    guests: 2,
    paymentMethod: "cash",
    ...over,
  })

  // Puts a confirmed booking in the store for a date that can no longer be booked through the API.
  let n = 0
  const confirmedBooking = async (userId: string, date: string) => {
    const ref = `SQ-T${String(++n).padStart(5, "0")}`
    await store.createBooking(
      { reference: ref, userId, packageId: 1, destinationId: 1, packageName: "Peak", destinationName: "Highlands", date, guests: 1, mealOption: null, totalPrice: 1000, addons: [], paymentMethod: "cash", paymentStatus: "unpaid" },
      5,
    )
    await store.updateBooking(ref, { status: "pending", paymentStatus: "unpaid" }, { status: "confirmed" })
    return ref
  }

  describe("mock payment", () => {
    it("needs a valid payment method", async () => {
      assert.equal((await call("POST", "/api/bookings", trip({ paymentMethod: undefined }), "u1")).status, 400)
      assert.equal((await call("POST", "/api/bookings", trip({ paymentMethod: "bitcoin" }), "u1")).status, 400)
    })

    it("GCash and card count as paid straight away, cash stays unpaid", async () => {
      const g = await json(await call("POST", "/api/bookings", trip({ paymentMethod: "gcash" }), "u1"))
      assert.equal(g.paymentStatus, "paid")
      assert.equal(g.paymentMethod, "gcash")
      assert.equal(g.status, "pending")
      const c = await json(await call("POST", "/api/bookings", trip({ paymentMethod: "card" }), "u1"))
      assert.equal(c.paymentStatus, "paid")
      const cash = await json(await call("POST", "/api/bookings", trip({ paymentMethod: "cash" }), "u1"))
      assert.equal(cash.paymentStatus, "unpaid")
      assert.equal(cash.paymentMethod, "cash")
    })

    it("a paid booking that gets rejected can be refunded by an admin", async () => {
      const b = await json(await call("POST", "/api/bookings", trip({ paymentMethod: "gcash" }), "u2"))
      const rejected = await json(await call("PATCH", `/api/admin/bookings/${b.reference}`, { status: "rejected" }, "admin1"))
      assert.equal(rejected.status, "rejected")
      assert.equal(rejected.paymentStatus, "paid")
      const refunded = await call("PATCH", `/api/admin/bookings/${b.reference}`, { paymentStatus: "refunded" }, "admin1")
      assert.equal(refunded.status, 200)
      assert.equal((await json(refunded)).paymentStatus, "refunded")
    })
  })

  describe("inquiries", () => {
    const good = { name: "Mia", email: "mia@example.com", message: "Do you allow pets at the campsite?" }

    it("anyone can send one, and admins can read and mark it", async () => {
      assert.equal((await call("POST", "/api/inquiries", { ...good, phone: "0917 111 2222" })).status, 201)
      assert.equal((await call("GET", "/api/admin/inquiries", undefined, "bob")).status, 403)
      assert.equal((await call("GET", "/api/admin/inquiries")).status, 401)
      const list = await json(await call("GET", "/api/admin/inquiries", undefined, "admin1"))
      assert.equal(list.length, 1)
      assert.equal(list[0].status, "new")
      assert.equal(list[0].phone, "0917 111 2222")

      const read = await json(await call("PATCH", `/api/admin/inquiries/${list[0].id}`, { status: "read" }, "admin1"))
      assert.equal(read.status, "read")
      assert.equal((await call("PATCH", `/api/admin/inquiries/${list[0].id}`, { status: "x" }, "admin1")).status, 400)
      assert.equal((await call("PATCH", "/api/admin/inquiries/999", { status: "read" }, "admin1")).status, 404)
    })

    it("rejects missing or bad details", async () => {
      assert.equal((await call("POST", "/api/inquiries", { ...good, name: "" })).status, 400)
      assert.equal((await call("POST", "/api/inquiries", { ...good, email: "nope" })).status, 400)
      assert.equal((await call("POST", "/api/inquiries", { ...good, message: "hi" })).status, 400)
      assert.equal((await call("POST", "/api/inquiries", { ...good, message: "x".repeat(2001) })).status, 400)
    })

    it("silently drops bot submissions that fill the hidden field", async () => {
      const before = (await json(await call("GET", "/api/admin/inquiries", undefined, "admin1"))).length
      assert.equal((await call("POST", "/api/inquiries", { ...good, website: "http://spam" })).status, 201)
      assert.equal((await json(await call("GET", "/api/admin/inquiries", undefined, "admin1"))).length, before)
    })
  })

  describe("reviews", () => {
    it("can't be written before the trip is done, unless early reviews are on", async () => {
      const b = await json(await call("POST", "/api/bookings", trip(), "ana"))
      await call("PATCH", `/api/admin/bookings/${b.reference}`, { status: "confirmed" }, "admin1")
      let mine = await json(await call("GET", "/api/bookings/mine", undefined, "ana"))
      assert.equal(mine[0].reviewable, false)
      const r = await call("POST", `/api/bookings/${b.reference}/review`, { rating: 5, comment: "Looking forward!" }, "ana")
      assert.equal(r.status, 409)

      early = true
      mine = await json(await call("GET", "/api/bookings/mine", undefined, "ana"))
      assert.equal(mine[0].reviewable, true)
      early = false
    })

    it("full flow: review, moderation, public page", async () => {
      const ref = await confirmedBooking("ana", PAST)
      const mine = await json(await call("GET", "/api/bookings/mine", undefined, "ana"))
      assert.equal(mine.find((x: any) => x.reference === ref).reviewable, true)

      // validation
      assert.equal((await call("POST", `/api/bookings/${ref}/review`, { rating: 0, comment: "Great stay" }, "ana")).status, 400)
      assert.equal((await call("POST", `/api/bookings/${ref}/review`, { rating: 4.5, comment: "Great stay" }, "ana")).status, 400)
      assert.equal((await call("POST", `/api/bookings/${ref}/review`, { rating: 5, comment: "ok" }, "ana")).status, 400)
      assert.equal((await call("POST", `/api/bookings/${ref}/review`, { rating: 5, comment: "Great stay" })).status, 401)
      // somebody else's booking looks like it doesn't exist
      assert.equal((await call("POST", `/api/bookings/${ref}/review`, { rating: 5, comment: "Great stay" }, "eve")).status, 404)

      const ok = await call("POST", `/api/bookings/${ref}/review`, { rating: 5, comment: "Great stay, loved the view" }, "ana")
      assert.equal(ok.status, 201)
      const review = await json(ok)
      assert.equal(review.status, "pending")

      // only one per booking
      assert.equal((await call("POST", `/api/bookings/${ref}/review`, { rating: 4, comment: "Second try here" }, "ana")).status, 409)

      // shows on the booking, not yet public
      const after = await json(await call("GET", `/api/bookings/${ref}`, undefined, "ana"))
      assert.equal(after.reviewable, false)
      assert.equal(after.review.rating, 5)
      assert.equal((await json(await call("GET", "/api/reviews"))).length, 0)

      // admin approves
      assert.equal((await call("GET", "/api/admin/reviews", undefined, "ana")).status, 403)
      const all = await json(await call("GET", "/api/admin/reviews", undefined, "admin1"))
      assert.equal(all[0].customerName, "Ana Reyes")
      assert.equal(all[0].packageName, "Peak")
      assert.equal((await call("PATCH", `/api/admin/reviews/${review.id}`, { status: "nope" }, "admin1")).status, 400)
      const approved = await call("PATCH", `/api/admin/reviews/${review.id}`, { status: "approved" }, "admin1")
      assert.equal((await json(approved)).status, "approved")

      // public: first name only, nothing private
      const pub = await json(await call("GET", "/api/reviews"))
      assert.equal(pub.length, 1)
      assert.equal(pub[0].firstName, "Ana")
      assert.equal(pub[0].packageName, "Peak")
      assert.equal(JSON.stringify(pub).includes("Reyes"), false)
      assert.equal("reference" in pub[0], false)

      // admin hides it again
      await call("PATCH", `/api/admin/reviews/${review.id}`, { status: "hidden" }, "admin1")
      assert.equal((await json(await call("GET", "/api/reviews"))).length, 0)
    })

    it("a cancelled booking can't be reviewed", async () => {
      const ref = await confirmedBooking("zed", PAST)
      await store.updateBooking(ref, { status: "confirmed", paymentStatus: "unpaid" }, { status: "cancelled" })
      assert.equal((await call("POST", `/api/bookings/${ref}/review`, { rating: 3, comment: "Not good at all" }, "zed")).status, 409)
    })
  })
})