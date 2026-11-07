import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import type { AddressInfo } from "node:net"
import type { Server } from "node:http"
import { createApp } from "./app.js"
import { createMemoryCatalog, createMemoryStore } from "./memoryStore.js"

const TODAY = "2030-06-10"
const DAY = "2030-06-15"

describe("admin content API", () => {
  let server: Server
  let url: string

  before(() => {
    const store = createMemoryStore([{ id: 1, name: "Breakfast", type: "meal", price: 200, priceType: "per_guest" }], undefined, {
      destinations: [
        { id: 1, slug: "highlands", name: "Highlands", category: "mountain", location: null, description: null, imageUrl: null, scene: "mountain", status: "active" },
        { id: 2, slug: "coastline", name: "Coastline", category: "beach", location: null, description: null, imageUrl: null, scene: "beach", status: "active" },
      ],
      packages: [
        { id: 1, slug: "peak", name: "Peak", tagline: null, description: null, capacity: 4, pricingType: "per_guest", basePrice: 1000, inclusions: [], imageUrl: null, scene: "camp", status: "active", destinationIds: [1] },
      ],
    })
    const tokenOf = (h: string | undefined) => (h ?? "").replace("Bearer ", "")
    const app = createApp({
      catalog: createMemoryCatalog(store),
      store,
      content: store,
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
      defaultDailyLimit: 2,
      today: () => TODAY,
    })
    server = app.listen(0)
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  after(() => void server.close())

  const call = (method: string, path: string, body?: unknown, user = "admin1") =>
    fetch(url + path, {
      method,
      headers: { "content-type": "application/json", ...(user ? { authorization: `Bearer ${user}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  const json = async (res: Response) => (await res.json()) as any

  it("only admins can use it", async () => {
    assert.equal((await call("GET", "/api/admin/packages", undefined, "")).status, 401)
    assert.equal((await call("GET", "/api/admin/packages", undefined, "cust1")).status, 403)
    assert.equal((await call("POST", "/api/admin/packages", { name: "X" }, "cust1")).status, 403)
    assert.equal((await call("PUT", "/api/admin/limits", {}, "cust1")).status, 403)
  })

  it("creates a package with a slug from its name, and it shows up publicly", async () => {
    const res = await call("POST", "/api/admin/packages", {
      name: "Sunset & Stars",
      tagline: "Evening camp",
      basePrice: 1500.456,
      capacity: 6,
      inclusions: ["  Tent ", "", "Firewood"],
      destinationIds: [1, 2],
    })
    assert.equal(res.status, 201)
    const created = await json(res)
    assert.equal(created.slug, "sunset-and-stars")
    assert.equal(created.basePrice, 1500.46)
    assert.deepEqual(created.inclusions, ["Tent", "Firewood"])
    assert.equal(created.status, "active")

    const pub = await json(await fetch(url + "/api/packages/sunset-and-stars"))
    assert.equal(pub.basePrice, 1500.46)
    assert.deepEqual(pub.destinations.map((d: any) => d.slug), ["highlands", "coastline"])

    const again = await json(await call("POST", "/api/admin/packages", { name: "Sunset & Stars" }))
    assert.equal(again.slug, "sunset-and-stars-2")
  })

  it("rejects bad package details with a clear message", async () => {
    const bad = async (body: object) => {
      const res = await call("POST", "/api/admin/packages", { name: "Bad", ...body })
      assert.equal(res.status, 400, JSON.stringify(body))
      return (await json(res)).error as string
    }
    assert.match(await bad({ name: "  " }), /Name is required/)
    assert.match(await bad({ basePrice: -5 }), /Price/)
    assert.match(await bad({ basePrice: "100" }), /Price/)
    assert.match(await bad({ capacity: 0 }), /Max guests/)
    assert.match(await bad({ capacity: 2.5 }), /Max guests/)
    assert.match(await bad({ pricingType: "weekly" }), /Pricing type/)
    assert.match(await bad({ imageUrl: "javascript:alert(1)" }), /Photo link/)
    assert.match(await bad({ imageUrl: "//evil.example/x.png" }), /Photo link/)
    assert.match(await bad({ destinationIds: [99] }), /destinations/)
    assert.match(await bad({ inclusions: "tent" }), /Inclusions/)
    assert.equal((await call("POST", "/api/admin/packages", "nope")).status, 400)
  })

  it("accepts photo links that are web links or site paths", async () => {
    const a = await call("PATCH", "/api/admin/packages/1", { imageUrl: "https://example.com/a.jpg" })
    assert.equal((await json(a)).imageUrl, "https://example.com/a.jpg")
    const b = await call("PATCH", "/api/admin/packages/1", { imageUrl: "/images/peak.webp" })
    assert.equal((await json(b)).imageUrl, "/images/peak.webp")
    const c = await call("PATCH", "/api/admin/packages/1", { imageUrl: "" })
    assert.equal((await json(c)).imageUrl, null)
  })

  it("editing changes only what was sent, keeps the slug, and the price reaches customers", async () => {
    const res = await call("PATCH", "/api/admin/packages/1", { basePrice: 2000, name: "Peak Deluxe" })
    const updated = await json(res)
    assert.equal(updated.slug, "peak")
    assert.equal(updated.name, "Peak Deluxe")
    assert.equal(updated.capacity, 4)

    const quote = await json(
      await call("POST", "/api/price/calculate", { packageSlug: "peak", guests: 2 }, "cust1"),
    )
    assert.equal(quote.total, 4000)

    assert.equal((await call("PATCH", "/api/admin/packages/1", {})).status, 400)
    assert.equal((await call("PATCH", "/api/admin/packages/999", { name: "x" })).status, 404)
    assert.equal((await call("PATCH", "/api/admin/packages/abc", { name: "x" })).status, 400)
  })

  it("hides inactive packages and destinations from the public site", async () => {
    await call("PATCH", "/api/admin/packages/1", { status: "inactive" })
    assert.equal((await fetch(url + "/api/packages/peak")).status, 404)
    const listed = await json(await call("GET", "/api/admin/packages"))
    assert.equal(listed.find((p: any) => p.id === 1).status, "inactive")
    await call("PATCH", "/api/admin/packages/1", { status: "active" })
    assert.equal((await fetch(url + "/api/packages/peak")).status, 200)

    await call("PATCH", "/api/admin/destinations/2", { status: "inactive" })
    const pkg = await json(await fetch(url + "/api/packages/sunset-and-stars"))
    assert.deepEqual(pkg.destinations.map((d: any) => d.slug), ["highlands"])
    await call("PATCH", "/api/admin/destinations/2", { status: "active" })
  })

  it("changes which destinations a package is offered at", async () => {
    const res = await call("PATCH", "/api/admin/packages/1", { destinationIds: [2] })
    assert.deepEqual((await json(res)).destinationIds, [2])
    const dest = await json(await fetch(url + "/api/destinations/highlands"))
    assert.ok(!dest.packages.some((p: any) => p.slug === "peak"))
    await call("PATCH", "/api/admin/packages/1", { destinationIds: [1] })
  })

  it("creates and edits destinations", async () => {
    const res = await call("POST", "/api/admin/destinations", { name: "Island Hop", category: "beach", location: "Cebu" })
    assert.equal(res.status, 201)
    const d = await json(res)
    assert.equal(d.slug, "island-hop")
    assert.equal(d.scene, "forest")

    const patched = await json(await call("PATCH", `/api/admin/destinations/${d.id}`, { location: "Bantayan", category: "mountain" }))
    assert.equal(patched.location, "Bantayan")
    assert.equal(patched.category, "mountain")

    assert.equal((await call("POST", "/api/admin/destinations", { name: "X", category: "desert" })).status, 400)
    assert.equal((await call("PATCH", "/api/admin/destinations/999", { name: "x" })).status, 404)
  })

  it("manages add-ons, and inactive ones leave the booking page", async () => {
    const created = await json(await call("POST", "/api/admin/addons", { name: "Guide", type: "extra", price: 500 }))
    assert.equal(created.priceType, "per_booking")
    assert.equal(created.status, "active")
    assert.ok((await json(await fetch(url + "/api/addons"))).some((a: any) => a.name === "Guide"))

    const edited = await json(await call("PATCH", `/api/admin/addons/${created.id}`, { price: 650, priceType: "per_guest" }))
    assert.equal(edited.price, 650)

    await call("PATCH", `/api/admin/addons/${created.id}`, { status: "inactive" })
    assert.ok(!(await json(await fetch(url + "/api/addons"))).some((a: any) => a.name === "Guide"))
    assert.ok((await json(await call("GET", "/api/admin/addons"))).some((a: any) => a.name === "Guide"))

    assert.equal((await call("POST", "/api/admin/addons", { name: "Bad", type: "extra", price: -1 })).status, 400)
    assert.equal((await call("POST", "/api/admin/addons", { name: "Bad", type: "extra" })).status, 400)
    assert.equal((await call("POST", "/api/admin/addons", { name: "Bad", type: "gift", price: 1 })).status, 400)
  })

  describe("daily limits", () => {
    const book = async (user: string, date = DAY) =>
      (await call("POST", "/api/bookings", { packageSlug: "peak", destinationSlug: "highlands", date, guests: 1 }, user)).status

    it("a date-specific limit overrides the default", async () => {
      assert.equal((await call("PUT", "/api/admin/limits", { packageId: 1, destinationId: 1, date: DAY, maxBookings: 1 })).status, 200)
      assert.equal(await book("cust-a"), 201)
      assert.equal(await book("cust-b"), 409) // limit 1 reached (default would have allowed 2)

      const listed = await json(await call("GET", "/api/admin/limits?packageId=1&destinationId=1"))
      assert.equal(listed.defaultLimit, 2)
      assert.deepEqual(listed.limits, [{ date: DAY, maxBookings: 1, taken: 1 }])
    })

    it("raising it lets more people book, and removing it goes back to the default", async () => {
      await call("PUT", "/api/admin/limits", { packageId: 1, destinationId: 1, date: DAY, maxBookings: 3 })
      assert.equal(await book("cust-b"), 201)
      assert.equal(await book("cust-c"), 201)
      assert.equal(await book("cust-d"), 409)

      assert.equal((await call("DELETE", `/api/admin/limits?packageId=1&destinationId=1&date=${DAY}`)).status, 200)
      const listed = await json(await call("GET", "/api/admin/limits?packageId=1&destinationId=1"))
      assert.deepEqual(listed.limits, [])
    })

    it("0 closes a date", async () => {
      await call("PUT", "/api/admin/limits", { packageId: 1, destinationId: 1, date: "2030-07-01", maxBookings: 0 })
      assert.equal(await book("cust-a", "2030-07-01"), 409)
    })

    it("rejects invalid input", async () => {
      const put = (body: object) => call("PUT", "/api/admin/limits", { packageId: 1, destinationId: 1, date: DAY, maxBookings: 2, ...body })
      assert.equal((await put({ date: "2030-02-31" })).status, 400)
      assert.equal((await put({ date: "2030-06-09" })).status, 400) // before today
      assert.equal((await put({ maxBookings: -1 })).status, 400)
      assert.equal((await put({ maxBookings: 1.5 })).status, 400)
      assert.equal((await put({ maxBookings: 101 })).status, 400)
      assert.equal((await put({ destinationId: 2 })).status, 400) // peak isn't offered at coastline
      assert.equal((await put({ packageId: 99 })).status, 404)
      assert.equal((await call("GET", "/api/admin/limits?packageId=1")).status, 400)
    })
  })
})