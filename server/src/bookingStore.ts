
import type { Addon, PriceResult } from "./pricing.js"

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"

export interface CreateBookingInput {
  userId: string
  packageId: number
  destinationId: number
  bookingDate: string
  guests: number
  addonIds: number[]
  totalPrice: number
  priceBreakdown: PriceResult
}

export interface BookingRecord {
  id: string
  reference: string
  userId: string
  packageId: number
  destinationId: number
  bookingDate: string
  guests: number
  addonIds: number[]
  totalPrice: number
  status: BookingStatus
  createdAt: string
}

export interface AvailabilityInput {
  packageId: number
  destinationId: number
  date: string
}

export interface AvailabilityResult {
  available: boolean
  remaining: number
  limit: number
  booked: number
}

/**
 * Storage contract used by the API.
 * Memory and Supabase implementations provide the actual database operations.
 */
export interface BookingStore {
  listAddons(): Promise<Addon[]>

  checkAvailability(
    input: AvailabilityInput,
  ): Promise<AvailabilityResult>

  createBooking(
    input: CreateBookingInput,
  ): Promise<BookingRecord>

  listBookingsForUser(userId: string): Promise<BookingRecord[]>
}
