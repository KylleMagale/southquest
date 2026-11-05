
import { supabase } from "./supabase.js"
import type { Addon } from "./pricing.js"
import type {
  AvailabilityInput,
  AvailabilityResult,
  BookingRecord,
  BookingStore,
  CreateBookingInput,
} from "./bookingStore.js"

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured")
  }

  return supabase
}

function makeReference(): string {
  return `SQ-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`
}

function mapBooking(row: any): BookingRecord {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    packageId: Number(row.package_id),
    destinationId: Number(row.destination_id),
    bookingDate: row.booking_date,
    guests: Number(row.guests),
    addonIds: (row.booking_addons ?? []).map(
      (item: { addon_id: number }) => Number(item.addon_id),
    ),
    totalPrice: Number(row.total_price),
    status: row.status,
    createdAt: row.created_at,
  }
}

export function createSupabaseStore(
  defaultDailyLimit = Number(process.env.DEFAULT_DAILY_LIMIT ?? 3),
): BookingStore {
  return {
    async listAddons(): Promise<Addon[]> {
      const db = requireSupabase()

      const { data, error } = await db
        .from("addons")
        .select("id, name, type, price, price_type")
        .eq("status", "active")
        .order("id")

      if (error) throw new Error(error.message)

      return (data ?? []).map((row) => ({
        id: Number(row.id),
        name: row.name,
        type: row.type,
        price: Number(row.price),
        priceType: row.price_type,
      }))
    },

    async checkAvailability(
      input: AvailabilityInput,
    ): Promise<AvailabilityResult> {
      const db = requireSupabase()

      const { data: limitRow, error: limitError } = await db
        .from("daily_limits")
        .select("max_bookings")
        .eq("package_id", input.packageId)
        .eq("destination_id", input.destinationId)
        .eq("limit_date", input.date)
        .maybeSingle()

      if (limitError) throw new Error(limitError.message)

      const limit = Math.max(
        0,
        Number(limitRow?.max_bookings ?? defaultDailyLimit),
      )

      const { count, error } = await db
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("package_id", input.packageId)
        .eq("destination_id", input.destinationId)
        .eq("booking_date", input.date)
        .in("status", ["pending", "confirmed"])

      if (error) throw new Error(error.message)

      const booked = count ?? 0

      return {
        available: booked < limit,
        remaining: Math.max(0, limit - booked),
        limit,
        booked,
      }
    },

    async createBooking(
      input: CreateBookingInput,
    ): Promise<BookingRecord> {
      const db = requireSupabase()

      const availability = await this.checkAvailability({
        packageId: input.packageId,
        destinationId: input.destinationId,
        date: input.bookingDate,
      })

      if (!availability.available) {
        throw new Error("No availability for this date")
      }

      const { data: row, error } = await db
        .from("bookings")
        .insert({
          reference: makeReference(),
          user_id: input.userId,
          package_id: input.packageId,
          destination_id: input.destinationId,
          booking_date: input.bookingDate,
          guests: input.guests,
          total_price: input.totalPrice,
          status: "pending",
          payment_status: "unpaid",
        })
        .select("*")
        .single()

      if (error) throw new Error(error.message)

      if (input.addonIds.length > 0) {
        const allAddons = await this.listAddons()

        const addonRows = input.addonIds.map((addonId) => {
          const addon = allAddons.find((item) => item.id === addonId)

          if (!addon) {
            throw new Error(`Add-on ${addonId} is no longer available`)
          }

          return {
            booking_id: row.id,
            addon_id: addonId,
            price_at_booking: addon.price,
          }
        })

        const { error: addonError } = await db
          .from("booking_addons")
          .insert(addonRows)

        if (addonError) {
          await db.from("bookings").delete().eq("id", row.id)
          throw new Error(addonError.message)
        }
      }

      return {
        ...mapBooking(row),
        addonIds: [...input.addonIds],
      }
    },

    async listBookingsForUser(
      userId: string,
    ): Promise<BookingRecord[]> {
      const db = requireSupabase()

      const { data, error } = await db
        .from("bookings")
        .select("*, booking_addons(addon_id)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw new Error(error.message)

      return (data ?? []).map(mapBooking)
    },
  }
}
