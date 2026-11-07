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
  addons: Addon[] = [],
  customerOf: (userId: string) => Customer = () => ({ name: null, email: null, phone: null }),
): BookingStore {
  const bookings: (BookingRecord & { packageId: number; destinationId: number })[] = []

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
    },
    async availability(packageId, destinationId, date) {
      return { limit: null, taken: taken(packageId, destinationId, date) }
    },
    async createBooking(input: NewBooking, defaultLimit: number) {
      // No awaits between the check and the insert, so this is atomic in a single Node process.
      if (bookings.some((b) => b.reference === input.reference)) throw new DuplicateReferenceError()
      if (taken(input.packageId, input.destinationId, input.date) >= defaultLimit) throw new FullyBookedError()
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
  }
}