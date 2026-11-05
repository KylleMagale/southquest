
import type { Addon } from "./pricing.js"
import type {
  AvailabilityInput,
  AvailabilityResult,
  BookingRecord,
  BookingStore,
  CreateBookingInput,
} from "./bookingStore.js"

function makeReference(): string {
  return `SQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export function createMemoryStore(
  addons: Addon[] = [],
  defaultDailyLimit = Number(process.env.DEFAULT_DAILY_LIMIT ?? 3),
): BookingStore {
  const bookings: BookingRecord[] = []

  function getAvailability(input: AvailabilityInput): AvailabilityResult {
    const matching = bookings.filter(
      (booking) =>
        booking.packageId === input.packageId &&
        booking.destinationId === input.destinationId &&
        booking.bookingDate === input.date &&
        booking.status !== "rejected" &&
        booking.status !== "cancelled",
    )

    const booked = matching.length
    const limit = Math.max(0, defaultDailyLimit)

    return {
      available: booked < limit,
      remaining: Math.max(0, limit - booked),
      limit,
      booked,
    }
  }

  return {
    async listAddons() {
      return addons.filter((addon) => addon.price >= 0)
    },

    async checkAvailability(input) {
      return getAvailability(input)
    },

    async createBooking(input: CreateBookingInput) {
      // The availability check and insertion run synchronously
      // in this single Node.js process.
      const availability = getAvailability({
        packageId: input.packageId,
        destinationId: input.destinationId,
        date: input.bookingDate,
      })

      if (!availability.available) {
        throw new Error("No availability for this date")
      }

      const booking: BookingRecord = {
        id: crypto.randomUUID(),
        reference: makeReference(),
        userId: input.userId,
        packageId: input.packageId,
        destinationId: input.destinationId,
        bookingDate: input.bookingDate,
        guests: input.guests,
        addonIds: [...input.addonIds],
        totalPrice: input.totalPrice,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      bookings.push(booking)

      return {
        ...booking,
        addonIds: [...booking.addonIds],
      }
    },

    async listBookingsForUser(userId) {
      return bookings
        .filter((booking) => booking.userId === userId)
        .map((booking) => ({
          ...booking,
          addonIds: [...booking.addonIds],
        }))
    },
  }
}
