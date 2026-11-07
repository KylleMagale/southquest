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
import type { Addon } from "./pricing.js"

/* eslint-disable @typescript-eslint/no-explicit-any */
const BOOKING_SELECT =
  "reference, user_id, booking_date, guests, meal_option, total_price, status, payment_status, created_at, " +
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
  createdAt: row.created_at,
})

export function createSupabaseStore(db: SupabaseClient): BookingStore {
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
  }
}