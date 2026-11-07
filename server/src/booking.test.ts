import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import type { AddressInfo } from "node:net"
import type { Server } from "node:http"
import { checkChange, createApp, type Catalog } from "./app.js"
import { createMemoryStore } from "./memoryStore.js"
import { calculatePrice, type Addon } from "./pricing.js"
import type { Destination, Package } from "./types.js"

const highlands = { id: 1, slug: "highlands", name: "Highlands", category: "mountain", scene: "mountain" } as const
const coast = { id: 2, slug: "coastline", name: "Coastline", category: "beach", scene: "beach" } as const

const base = { tagline: null, scene: "camp", description: null, imageUrl: null } as const
const packages: Package[] = [
  { ...base, id: 1, slug: "per-guest", name: "Per Guest", pricingType: "per_guest", basePrice: 1000, capacity: 4, inclusions: [], destinations: [highlands] },
  { ...base, id: 2, slug: "flat", name: "Flat", pricingType: "flat", basePrice: 5000, capacity: null, inclusions: [], destinations: [highlands, coast] },
  { ...base, id: 3, slug: "unpriced", name: "Unpriced", pricingType: "per_guest", basePrice: null, capacity: 4, inclusions: [], destinations: [highlands] },
]
const catalog: Catalog = {
  listPackages: async () => packages,
  getPackage: async (slug) => packages.find((p) => p.slug === slug) ?? null,
  listDestinations: async () => [] as Destination[],
  getDestination: async () => null,
}
const addons: Addon[] = [
  { id: 1, name: "Breakfast", type: "meal", price: 200, priceType: "per_guest" },
  { id: 2, name: "Firewood", type: "extra", price: 150, priceType: "per_booking" },
]

describe("calculatePrice", () => {
  it("per-guest package plus per-guest and per-booking add-ons", () => {
    const r = calculatePrice({ pricingType: "per_guest", basePrice: 1000, guests: 3, addons })
    assert.equal(r.total, 3000 + 600 + 150)
    assert.equal(r.lines.length, 3)
  })
  it("flat package ignores guest count", () => {
    assert.equal(calculatePrice({ pricingType: "flat", basePrice: 5000, guests: 9, addons: [] }).total, 5000)
  })
  it("rounds to centavos", () => {
    const r = calculatePrice({ pricingType: "per_guest", basePrice: 0.1, guests: 3, addons: [] })
    assert.equal(r.total, 0.3)
  })
})

describe("API", () => {
  let server: Server
  let url: string
  const TODAY = "2030-06-10"
  const OK_DATE = "2030-06-15"

  before(async () => {
    const memory = createMemoryStore(addons, (id) => ({ name: `Name ${id}`, email: `${id}@example.com`, phone: "0917 000 0000" }))
    const app = createApp({
      catalog,
      store: memory,
      content: memory,
      
      // Test auth: "Authorization: Bearer <userId>". Ids starting with "admin" are admins.
      requireAuth: (req, res, next) => {
        const token = (req.headers.authorization ?? "").replace("Bearer ", "")
        if (!token) {
          res.status(401).json({ error: "Sign in required" })
          return
        }
        res.locals.user = { id: token, role: token.startsWith("admin") ? "admin" : "customer" }
        next()
      },
      requireAdmin: (req, res, next) => {
        const token = (req.headers.authorization ?? "").replace("Bearer ", "")
        if (!token) {
          res.status(401).json({ error: "Sign in required" })
          return
        }
        if (!token.startsWith("admin")) {
          res.status(403).json({ error: "Admins only" })
          return
        }
        res.locals.user = { id: token, role: "admin" }
        next()
      },
      dataSource: "test",
      defaultDailyLimit: 2,
      today: () => TODAY,
    })
    server = app.listen(0)
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  after(() => void server.close())

  const post = (path: string, body: unknown, user?: string) =>
    fetch(url + path, {
      method: "POST",
      headers: { "content-type": "application/json", ...(user ? { authorization: `Bearer ${user}` } : {}) },
      body: JSON.stringify(body),
    })
  const patch = (path: string, body: unknown, user?: string) =>
    fetch(url + path, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...(user ? { authorization: `Bearer ${user}` } : {}) },
      body: JSON.stringify(body),
    })
  const get = (path: string, user?: string) =>
    fetch(url + path, { headers: user ? { authorization: `Bearer ${user}` } : {} })

  const trip = (over: Record<string, unknown> = {}) => ({
    packageSlug: "per-guest",
    destinationSlug: "highlands",
    date: OK_DATE,
    guests: 2,
    addonIds: [],
    ...over,
  })

  it("price/calculate returns server-side breakdown", async () => {
    const r = await post("/api/price/calculate", { packageSlug: "per-guest", guests: 2, addonIds: [1, 2] })
    const j = await r.json()
    assert.equal(j.priceAvailable, true)
    assert.equal(j.total, 2000 + 400 + 150)
  })

  it("price/calculate says so when the package has no price yet", async () => {
    const j = await (await post("/api/price/calculate", { packageSlug: "unpriced", guests: 2 })).json()
    assert.equal(j.priceAvailable, false)
  })

  it("price lines carry quantity, unit price and total", async () => {
    const j = await (await post("/api/price/calculate", { packageSlug: "per-guest", guests: 3, addonIds: [1] })).json()
    assert.deepEqual(j.lines[0], { label: "Package", quantity: 3, unitPrice: 1000, total: 3000 })
    assert.deepEqual(j.lines[1], { label: "Breakfast", quantity: 3, unitPrice: 200, total: 600 })
    assert.equal(j.total, 3600)
  })

  it("availability also works as GET (used by the Builder page)", async () => {
    const q = (date: string) => get(`/api/availability?packageSlug=per-guest&destinationSlug=highlands&date=${date}`).then((r) => r.json())
    assert.equal((await q(OK_DATE)).available, true)
    assert.match((await q("2030-06-10")).reason, /tomorrow/)
  })

  it("a booking can be opened by its reference (confirmation page)", async () => {
    const b = await (await post("/api/bookings", trip({ date: "2030-09-01" }), "carol")).json()
    const r = await get(`/api/bookings/${b.reference}`, "carol")
    assert.equal(r.status, 200)
    const j = await r.json()
    assert.equal(j.packageName, "Per Guest")
    assert.equal(j.destinationName, "Highlands")
    assert.equal(j.date, "2030-09-01")
    assert.equal((await get(`/api/bookings/${b.reference}`, "dave")).status, 404)
  })

  it("rejects bad input with 400 and unknown package with 404", async () => {
    assert.equal((await post("/api/price/calculate", { packageSlug: "per-guest", guests: 0 })).status, 400)
    assert.equal((await post("/api/price/calculate", { packageSlug: "per-guest", guests: 1.5 })).status, 400)
    assert.equal((await post("/api/price/calculate", { packageSlug: "per-guest", guests: 2, addonIds: [99] })).status, 400)
    assert.equal((await post("/api/price/calculate", { packageSlug: "nope", guests: 2 })).status, 404)
  })

  it("availability: rules", async () => {
    const check = async (over: Record<string, unknown>) => (await post("/api/availability/check", trip(over))).json()
    assert.equal((await check({})).available, true)
    assert.match((await check({ date: "2030-06-10" })).reason, /tomorrow/) // today is not bookable
    assert.match((await check({ date: "2030-06-09" })).reason, /tomorrow/)
    assert.match((await check({ date: "2030-02-30" })).reason, /valid date/)
    assert.match((await check({ destinationSlug: "coastline" })).reason, /isn't offered/)
    assert.match((await check({ guests: 5 })).reason, /up to 4/)
    assert.equal((await check({ date: "2030-06-11" })).available, true) // tomorrow is fine
  })

  it("booking requires sign-in", async () => {
    assert.equal((await post("/api/bookings", trip())).status, 401)
    assert.equal((await get("/api/bookings/mine")).status, 401)
  })

  it("creates a booking: price computed by the server, client price ignored", async () => {
    const r = await post("/api/bookings", { ...trip({ addonIds: [1, 2] }), totalPrice: 1, price: 1 }, "alice")
    assert.equal(r.status, 201)
    const b = await r.json()
    assert.match(b.reference, /^SQ-[A-HJ-NP-Z2-9]{6}$/)
    assert.equal(b.totalPrice, 2000 + 400 + 150)
    assert.equal(b.status, "pending")
    assert.equal(b.paymentStatus, "unpaid")
    assert.equal(b.mealOption, "Breakfast")
    assert.deepEqual(b.addons, ["Breakfast", "Firewood"])
  })

  it("refuses to book an unpriced package", async () => {
    assert.equal((await post("/api/bookings", trip({ packageSlug: "unpriced" }), "alice")).status, 409)
  })

  it("admin accounts cannot place bookings", async () => {
    const res = await post(
      "/api/bookings",
      {
        packageSlug: "per-guest",
        destinationSlug: "highlands",
        guests: 2,
        date: "2030-09-15",
        addonIds: [],
      },
      "admin1"
    )

    assert.equal(res.status, 403)
  })

  it("users only see their own bookings", async () => {
    const mine = await (await get("/api/bookings/mine", "alice")).json()
    assert.equal(mine.length, 1)
    assert.equal((await get("/api/bookings/mine", "bob").then((r) => r.json())).length, 0)
    assert.equal((await get(`/api/bookings/${mine[0].reference}`, "alice")).status, 200)
    assert.equal((await get(`/api/bookings/${mine[0].reference}`, "bob")).status, 404)
  })

  it("daily limit: the date fills up and further bookings get 409", async () => {
    const date = "2030-07-01"
    assert.equal((await post("/api/bookings", trip({ date }), "a")).status, 201)
    assert.equal((await post("/api/bookings", trip({ date }), "b")).status, 201)
    const third = await post("/api/bookings", trip({ date }), "c")
    assert.equal(third.status, 409)
    assert.match((await third.json()).error, /Fully booked/)
    assert.equal((await (await post("/api/availability/check", trip({ date }))).json()).available, false)
    // a different date or destination is unaffected
    assert.equal((await post("/api/bookings", trip({ date: "2030-07-02" }), "c")).status, 201)
  })

  it("never overbooks under parallel requests", async () => {
    const date = "2030-08-01"
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => post("/api/bookings", trip({ packageSlug: "flat", date }), `u${i}`)))
    const statuses = results.map((r) => r.status).sort()
    assert.deepEqual(statuses, [201, 201, 409, 409, 409, 409, 409, 409]) // limit is 2
  })

  describe("admin bookings", () => {
    const book = async (user: string, date: string, over: Record<string, unknown> = {}) =>
      (await (await post("/api/bookings", trip({ date, ...over }), user)).json()) as { reference: string }
    const act = (ref: string, body: unknown, user = "admin1") => patch(`/api/admin/bookings/${ref}`, body, user)

    it("only admins can list or change bookings", async () => {
      const b = await book("erin", "2030-10-01")
      assert.equal((await get("/api/admin/bookings")).status, 401)
      assert.equal((await get("/api/admin/bookings", "erin")).status, 403)
      assert.equal((await act(b.reference, { status: "confirmed" }, "erin")).status, 403)
      assert.equal((await patch(`/api/admin/bookings/${b.reference}`, { status: "confirmed" })).status, 401)
    })

    it("the list shows every booking with who made it, newest first", async () => {
      const first = await book("frank", "2030-10-02")
      const second = await book("gina", "2030-10-03")
      const list = (await (await get("/api/admin/bookings", "admin1")).json()) as any[]
      const a = list.find((x) => x.reference === first.reference)
      assert.equal(a.customer.name, "Name frank")
      assert.equal(a.customer.email, "frank@example.com")
      assert.equal(a.packageName, "Per Guest")
      assert.ok(list.findIndex((x) => x.reference === second.reference) < list.findIndex((x) => x.reference === first.reference))
    })

    it("confirming a booking is visible to the customer", async () => {
      const b = await book("hana", "2030-10-04")
      const r = await act(b.reference, { status: "confirmed" })
      assert.equal(r.status, 200)
      assert.equal((await r.json()).status, "confirmed")
      const mine = (await (await get("/api/bookings/mine", "hana")).json()) as any[]
      assert.equal(mine[0].status, "confirmed")
    })

    it("payment: only a confirmed booking can be marked paid, then refunded", async () => {
      const b = await book("ivan", "2030-10-05")
      assert.equal((await act(b.reference, { paymentStatus: "paid" })).status, 409) // still pending
      assert.equal((await act(b.reference, { status: "confirmed" })).status, 200)
      const paid = await act(b.reference, { paymentStatus: "paid" })
      assert.equal((await paid.json()).paymentStatus, "paid")
      assert.equal((await act(b.reference, { paymentStatus: "refunded" })).status, 200)
      assert.equal((await act(b.reference, { paymentStatus: "paid" })).status, 409) // refunded is final
    })

    it("confirm and mark paid in one request works", async () => {
      const b = await book("jade", "2030-10-06")
      const j = await (await act(b.reference, { status: "confirmed", paymentStatus: "paid" })).json()
      assert.equal(j.status, "confirmed")
      assert.equal(j.paymentStatus, "paid")
    })

    it("rejected and cancelled bookings are final", async () => {
      const b = await book("kira", "2030-10-07")
      assert.equal((await act(b.reference, { status: "rejected" })).status, 200)
      assert.equal((await act(b.reference, { status: "confirmed" })).status, 409)
      const c = await book("leo", "2030-10-08")
      await act(c.reference, { status: "confirmed" })
      assert.equal((await act(c.reference, { status: "cancelled" })).status, 200)
      assert.equal((await act(c.reference, { status: "pending" })).status, 409)
    })

    it("rejecting a booking frees its date for someone else", async () => {
      const date = "2030-10-10" // limit is 2
      const x = await book("mia", date)
      await book("noah", date)
      assert.equal((await post("/api/bookings", trip({ date }), "olga")).status, 409)
      await act(x.reference, { status: "rejected" })
      assert.equal((await post("/api/bookings", trip({ date }), "olga")).status, 201)
    })

    it("rejects bad requests", async () => {
      const b = await book("pia", "2030-10-11")
      assert.equal((await act(b.reference, { status: "banana" })).status, 400)
      assert.equal((await act(b.reference, { paymentStatus: "free" })).status, 400)
      assert.equal((await act(b.reference, {})).status, 400)
      assert.equal((await act("SQ-NOPE99", { status: "confirmed" })).status, 404)
    })

    it("asking for what is already true changes nothing and is not an error for the other field", async () => {
      const b = await book("quinn", "2030-10-12")
      assert.equal((await act(b.reference, { status: "pending" })).status, 400) // nothing to change
      const r = await act(b.reference, { status: "pending", paymentStatus: "paid" }) // pending can't be paid
      assert.equal(r.status, 409)
    })

    it("a stale change is refused instead of overwriting someone else's", async () => {
      const store = createMemoryStore(addons)
      const rec = await store.createBooking(
        { reference: "SQ-AAAAAA", userId: "u", packageId: 1, destinationId: 1, packageName: "P", destinationName: "D", date: "2030-11-01", guests: 1, mealOption: null, totalPrice: 1, addons: [] },
        3,
      )
      assert.ok(await store.updateBooking(rec.reference, { status: "pending", paymentStatus: "unpaid" }, { status: "confirmed" }))
      // a second admin still looking at the old "pending" state
      assert.equal(await store.updateBooking(rec.reference, { status: "pending", paymentStatus: "unpaid" }, { status: "rejected" }), null)
      assert.equal((await store.findByReference(rec.reference))?.status, "confirmed")
    })
  })

  it("checkChange: rules in one place", () => {
    const base = { status: "pending", paymentStatus: "unpaid" } as any
    assert.equal(checkChange(base, { status: "confirmed" }), null)
    assert.equal(checkChange(base, { status: "confirmed", paymentStatus: "paid" }), null)
    assert.match(checkChange(base, { paymentStatus: "paid" }) ?? "", /Confirm the booking/)
    assert.match(checkChange({ ...base, status: "rejected" }, { status: "confirmed" }) ?? "", /can't be changed/)
    assert.match(checkChange({ ...base, paymentStatus: "refunded" }, { paymentStatus: "paid" }) ?? "", /can't be marked/)
  })
})