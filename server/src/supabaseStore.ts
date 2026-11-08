import type { SupabaseClient } from "@supabase/supabase-js"
import {
  DuplicateReferenceError,
  FullyBookedError,
  type AdminBooking,
  type BookingRecord,
  type BookingStore,
  type Customer,
  type NewBooking,
} from "./bookingStore.js"
import {
  DuplicateReviewError,
  type AdminReview,
  type EngageStore,
  type Inquiry,
  type PublicReview,
  type Review,
} from "./engageStore.js"
import type { Addon } from "./pricing.js"
import type { AdminAddon, AdminDestination, AdminPackage, ContentStore } from "./contentStore.js"

/* eslint-disable @typescript-eslint/no-explicit-any */
const BOOKING_SELECT =
  "reference, user_id, booking_date, guests, meal_option, total_price, status, payment_status, payment_method, created_at, " +
  "packages(name), destinations(name), booking_addons(addons(name))"

const toRecord = (row: any): BookingRecord => ({
  reference: row.reference,
  userId: row.user_id,
  packageName: row.packages?.name ?? "",
  destinationName: row.destinations?.name ?? "",
  date: row.booking_date,
  guests: row.guests,
  mealOption: row.meal_option,
  addons: (row.booking_addons ?? []).map((ba: any) => ({ name: ba.addons?.name ?? "" })),
  totalPrice: Number(row.total_price),
  status: row.status,
  paymentStatus: row.payment_status,
  paymentMethod: row.payment_method ?? null,
  createdAt: row.created_at,
})

const PACKAGE_ROW = "*, package_destinations(destination_id)"

const toAdminPackage = (r: any): AdminPackage => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  tagline: r.tagline,
  description: r.description,
  capacity: r.capacity,
  pricingType: r.pricing_type,
  basePrice: r.base_price === null ? null : Number(r.base_price),
  inclusions: r.inclusions ?? [],
  imageUrl: r.image_url,
  scene: r.scene,
  status: r.status,
  destinationIds: (r.package_destinations ?? []).map((x: any) => x.destination_id),
})

const toAdminDestination = (r: any): AdminDestination => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  location: r.location,
  description: r.description,
  imageUrl: r.image_url,
  scene: r.scene,
  status: r.status,
})

const toAdminAddon = (r: any): AdminAddon => ({
  id: r.id,
  name: r.name,
  type: r.type,
  price: Number(r.price),
  priceType: r.price_type,
  status: r.status,
})


/** Only the columns that were actually sent (a PATCH), with database column names. */
  function pickColumns(patch: Record<string, unknown>, columns: Record<string, string>) {
    const out: Record<string, unknown> = {}
    for (const [key, column] of Object.entries(columns)) {
      if (patch[key] !== undefined) out[column] = patch[key]
    }
    return out
  }

  const PACKAGE_COLUMNS = {
    name: "name",
    tagline: "tagline",
    description: "description",
    capacity: "capacity",
    pricingType: "pricing_type",
    basePrice: "base_price",
    inclusions: "inclusions",
    imageUrl: "image_url",
    scene: "scene",
    status: "status",
  }

  const DESTINATION_COLUMNS = {
    name: "name",
    category: "category",
    location: "location",
    description: "description",
    imageUrl: "image_url",
    scene: "scene",
    status: "status",
  }

  const ADDON_COLUMNS = {
    name: "name",
    type: "type",
    price: "price",
    priceType: "price_type",
    status: "status",
  }

const REVIEW_SELECT = "id, user_id, rating, comment, status, created_at, bookings(reference, packages(name))"

const toReview = (r: any): Review => ({
  id: r.id,
  reference: r.bookings?.reference ?? "",
  rating: r.rating,
  comment: r.comment,
  status: r.status,
  createdAt: r.created_at,
})

const toInquiry = (r: any): Inquiry => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  message: r.message,
  status: r.status,
  createdAt: r.created_at,
})

export function createSupabaseStore(db: SupabaseClient): BookingStore & ContentStore & EngageStore {

  /** user id -> full name, from `profiles`. */
  async function namesOf(userIds: string[]): Promise<Map<string, string | null>> {
    const ids = [...new Set(userIds)]
    const names = new Map<string, string | null>()
    if (!ids.length) return names

    const { data, error } = await db.from("profiles").select("id, full_name").in("id", ids)
    if (error) throw new Error(error.message)

    for (const p of data as any[]) names.set(p.id, p.full_name)
    return names
  }

  /** Name and phone come from `profiles`, the email from Supabase Auth. */
  async function withCustomers(records: BookingRecord[]): Promise<AdminBooking[]> {
    const ids = [...new Set(records.map((r) => r.userId))]
    const customers = new Map<string, Customer>()
    if (ids.length) {
      const { data, error } = await db.from("profiles").select("id, full_name, phone").in("id", ids)
      if (error) throw new Error(error.message)
      for (const p of data as any[]) customers.set(p.id, { name: p.full_name, phone: p.phone, email: null })

      await Promise.all(
        ids.map(async (id) => {
          const { data: u } = await db.auth.admin.getUserById(id)
          const base = customers.get(id) ?? { name: null, phone: null, email: null }
          customers.set(id, { ...base, email: u?.user?.email ?? null })
        }),
      )
    }
    return records.map((r) => ({ ...r, customer: customers.get(r.userId) ?? { name: null, phone: null, email: null } }))
  }

  async function readPackage(id: number): Promise<AdminPackage | null> {
    const { data, error } = await db.from("packages").select(PACKAGE_ROW).eq("id", id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toAdminPackage(data) : null
  }

  /** Adds the new links first, then removes the ones that are no longer wanted. */
  async function setPackageDestinations(packageId: number, wanted: number[]) {
    const { data, error } = await db.from("package_destinations").select("destination_id").eq("package_id", packageId)
    if (error) throw new Error(error.message)
    const current = (data as any[]).map((x) => x.destination_id as number)

    const toAdd = wanted.filter((id) => !current.includes(id))
    if (toAdd.length) {
      const { error: addError } = await db
        .from("package_destinations")
        .insert(toAdd.map((destination_id) => ({ package_id: packageId, destination_id })))
      if (addError) throw new Error(addError.message)
    }

    const toRemove = current.filter((id) => !wanted.includes(id))
    if (toRemove.length) {
      const { error: removeError } = await db
        .from("package_destinations")
        .delete()
        .eq("package_id", packageId)
        .in("destination_id", toRemove)
      if (removeError) throw new Error(removeError.message)
    }
  }

  return {
    async listAddons() {
      const { data, error } = await db.from("addons").select("id, name, type, price, price_type").eq("status", "active").order("id")
      if (error) throw new Error(error.message)
      return (data as any[]).map(
        (a): Addon => ({ id: a.id, name: a.name, type: a.type, price: Number(a.price), priceType: a.price_type }),
      )
    },

    async availability(packageId, destinationId, date) {
      const limitRes = await db
        .from("daily_limits")
        .select("max_bookings")
        .eq("package_id", packageId)
        .eq("destination_id", destinationId)
        .eq("limit_date", date)
        .maybeSingle()
      if (limitRes.error) throw new Error(limitRes.error.message)

      const countRes = await db
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("package_id", packageId)
        .eq("destination_id", destinationId)
        .eq("booking_date", date)
        .in("status", ["pending", "confirmed"])
      if (countRes.error) throw new Error(countRes.error.message)

      return { limit: limitRes.data ? limitRes.data.max_bookings : null, taken: countRes.count ?? 0 }
    },

    async createBooking(input: NewBooking, defaultLimit: number) {
      // The create_booking SQL function takes a lock, re-checks the limit and inserts in one transaction.
      const { error } = await db.rpc("create_booking", {
        p_reference: input.reference,
        p_user_id: input.userId,
        p_package_id: input.packageId,
        p_destination_id: input.destinationId,
        p_booking_date: input.date,
        p_guests: input.guests,
        p_meal_option: input.mealOption,
        p_total_price: input.totalPrice,
        p_payment_method: input.paymentMethod,
        p_payment_status: input.paymentStatus,
        p_addon_ids: input.addons.map((a) => a.id),
        p_default_limit: defaultLimit,
      })
      if (error) {
        if (error.message.includes("FULLY_BOOKED")) throw new FullyBookedError()
        if (error.code === "23505") throw new DuplicateReferenceError()
        throw new Error(error.message)
      }
      const { data, error: readError } = await db
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("reference", input.reference)
        .single()
      if (readError) throw new Error(readError.message)
      return toRecord(data)
    },

    async listForUser(userId) {
      const { data, error } = await db
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      if (error) throw new Error(error.message)
      return (data as any[]).map(toRecord)
    },

    async findForUser(userId, reference) {
      const { data, error } = await db
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("user_id", userId)
        .eq("reference", reference)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data ? toRecord(data) : null
    },

    async listAll(limit) {
      const { data, error } = await db
        .from("bookings")
        .select(BOOKING_SELECT)
        .order("created_at", { ascending: false })
        .limit(limit)
      if (error) throw new Error(error.message)
      return withCustomers((data as any[]).map(toRecord))
    },

    async findByReference(reference) {
      const { data, error } = await db.from("bookings").select(BOOKING_SELECT).eq("reference", reference).maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) return null
      return (await withCustomers([toRecord(data)]))[0]
    },

    async updateBooking(reference, seen, change) {
      const patch: Record<string, string> = {}
      if (change.status) patch.status = change.status
      if (change.paymentStatus) patch.payment_status = change.paymentStatus

      // The extra .eq() filters make this a compare-and-set: it only applies if nobody changed the booking first.
      const { data, error } = await db
        .from("bookings")
        .update(patch)
        .eq("reference", reference)
        .eq("status", seen.status)
        .eq("payment_status", seen.paymentStatus)
        .select(BOOKING_SELECT)
        .maybeSingle()

      if (error) throw new Error(error.message)
      if (!data) return null
      return (await withCustomers([toRecord(data)]))[0]
    },

    // ---- content (admin) ----
    async listPackages() {
      const { data, error } = await db.from("packages").select(PACKAGE_ROW).order("id")
      if (error) throw new Error(error.message)
      return (data as any[]).map(toAdminPackage)
    },

    async createPackage(slug, input) {
      const { destinationIds, ...fields } = input
      const { data, error } = await db
        .from("packages")
        .insert({ slug, ...pickColumns(fields, PACKAGE_COLUMNS) })
        .select("id")
        .single()
      if (error) throw new Error(error.message)
      await setPackageDestinations(data.id, destinationIds)
      return (await readPackage(data.id))!
    },

    async updatePackage(id, patch) {
      const { destinationIds, ...fields } = patch
      const columns = pickColumns(fields, PACKAGE_COLUMNS)
      if (Object.keys(columns).length > 0) {
        const { data, error } = await db.from("packages").update(columns).eq("id", id).select("id").maybeSingle()
        if (error) throw new Error(error.message)
        if (!data) return null
      } else if (!(await readPackage(id))) {
        return null
      }
      if (destinationIds) await setPackageDestinations(id, destinationIds)
      return readPackage(id)
    },

    async listDestinations() {
      const { data, error } = await db.from("destinations").select("*").order("id")
      if (error) throw new Error(error.message)
      return (data as any[]).map(toAdminDestination)
    },

    async createDestination(slug, input) {
      const { data, error } = await db
        .from("destinations")
        .insert({ slug, ...pickColumns(input, DESTINATION_COLUMNS) })
        .select("*")
        .single()
      if (error) throw new Error(error.message)
      return toAdminDestination(data)
    },

    async updateDestination(id, patch) {
      const { data, error } = await db
        .from("destinations")
        .update(pickColumns(patch, DESTINATION_COLUMNS))
        .eq("id", id)
        .select("*")
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data ? toAdminDestination(data) : null
    },

    async listAllAddons() {
      const { data, error } = await db.from("addons").select("*").order("id")
      if (error) throw new Error(error.message)
      return (data as any[]).map(toAdminAddon)
    },

    async createAddon(input) {
      const { data, error } = await db.from("addons").insert(pickColumns(input, ADDON_COLUMNS)).select("*").single()
      if (error) throw new Error(error.message)
      return toAdminAddon(data)
    },

    async updateAddon(id, patch) {
      const { data, error } = await db
        .from("addons")
        .update(pickColumns(patch, ADDON_COLUMNS))
        .eq("id", id)
        .select("*")
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data ? toAdminAddon(data) : null
    },

    async listLimits(packageId, destinationId, fromDate) {
      const { data, error } = await db
        .from("daily_limits")
        .select("limit_date, max_bookings")
        .eq("package_id", packageId)
        .eq("destination_id", destinationId)
        .gte("limit_date", fromDate)
        .order("limit_date")
        .limit(120)
      if (error) throw new Error(error.message)
      return (data as any[]).map((r) => ({ date: r.limit_date, maxBookings: r.max_bookings }))
    },

    async setLimit(packageId, destinationId, date, maxBookings) {
      const { error } = await db
        .from("daily_limits")
        .upsert(
          { package_id: packageId, destination_id: destinationId, limit_date: date, max_bookings: maxBookings },
          { onConflict: "package_id,destination_id,limit_date" },
        )
      if (error) throw new Error(error.message)
    },

    
    async clearLimit(packageId, destinationId, date) {
      const { error } = await db
        .from("daily_limits")
        .delete()
        .eq("package_id", packageId)
        .eq("destination_id", destinationId)
        .eq("limit_date", date)
      if (error) throw new Error(error.message)
    },

    // ---- inquiries and reviews ----
    async createInquiry(input) {
      const { error } = await db
        .from("inquiries")
        .insert({ name: input.name, email: input.email, phone: input.phone, message: input.message })
      if (error) throw new Error(error.message)
    },

    async listInquiries(limit) {
      const { data, error } = await db.from("inquiries").select("*").order("created_at", { ascending: false }).limit(limit)
      if (error) throw new Error(error.message)
      return (data as any[]).map(toInquiry)
    },

    async setInquiryStatus(id, status) {
      const { data, error } = await db.from("inquiries").update({ status }).eq("id", id).select("*").maybeSingle()
      if (error) throw new Error(error.message)
      return data ? toInquiry(data) : null
    },

    async createReview(userId, reference, rating, comment) {
      const found = await db.from("bookings").select("id").eq("user_id", userId).eq("reference", reference).maybeSingle()
      if (found.error) throw new Error(found.error.message)
      if (!found.data) return null

      const { data, error } = await db
        .from("reviews")
        .insert({ booking_id: found.data.id, user_id: userId, rating, comment })
        .select(REVIEW_SELECT)
        .single()

      if (error) {
        if (error.code === "23505") throw new DuplicateReviewError()
        throw new Error(error.message)
      }
      return toReview(data)
    },

    async listReviewsForUser(userId) {
      const { data, error } = await db.from("reviews").select(REVIEW_SELECT).eq("user_id", userId)
      if (error) throw new Error(error.message)
      return (data as any[]).map(toReview)
    },

    async listPublicReviews(limit) {
      const { data, error } = await db
        .from("reviews")
        .select(REVIEW_SELECT)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message)

      const rows = data as any[]
      const names = await namesOf(rows.map((r) => r.user_id))

      return rows.map(
        (r): PublicReview => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          firstName: names.get(r.user_id)?.trim().split(/\s+/)[0] || "Guest",
          packageName: r.bookings?.packages?.name ?? "",
          createdAt: r.created_at,
        }),
      )
    },

    async listAllReviews(limit) {
      const { data, error } = await db
        .from("reviews")
        .select(REVIEW_SELECT)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message)

      const rows = data as any[]
      const names = await namesOf(rows.map((r) => r.user_id))

      return rows.map(
        (r): AdminReview => ({
          ...toReview(r),
          customerName: names.get(r.user_id) ?? null,
          packageName: r.bookings?.packages?.name ?? "",
        }),
      )
    },

    async setReviewStatus(id, status) {
      const { data, error } = await db.from("reviews").update({ status }).eq("id", id).select(REVIEW_SELECT).maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) return null

      const names = await namesOf([data.user_id])

      return {
        ...toReview(data),
        customerName: names.get(data.user_id) ?? null,
        packageName: (data as any).bookings?.packages?.name ?? "",
      }
    },
  }
}
