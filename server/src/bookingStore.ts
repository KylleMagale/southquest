import type { Addon } from "./pricing.js"

export interface NewBooking {
  reference: string
  userId: string
  packageId: number
  destinationId: number
  packageName: string
  destinationName: string
  date: string
  guests: number
  mealOption: string | null
  totalPrice: number
  addons: Addon[]
}

export interface BookingRecord {
  reference: string
  userId: string
  packageName: string
  destinationName: string
  date: string
  guests: number
  mealOption: string | null
  addons: { name: string }[]
  totalPrice: number
  status: "pending" | "confirmed" | "rejected" | "cancelled"
  paymentStatus: "unpaid" | "paid" | "refunded"
  createdAt: string
}

export interface Customer {
  name: string | null
  email: string | null
  phone: string | null
}

/** A booking plus who made it. Only admins ever see this. */
export interface AdminBooking extends BookingRecord {
  customer: Customer
}

export interface BookingChange {
  status?: BookingRecord["status"]
  paymentStatus?: BookingRecord["paymentStatus"]
}

export class FullyBookedError extends Error {}
export class DuplicateReferenceError extends Error {}

export interface BookingStore {
  listAddons(): Promise<Addon[]>
  /** limit = per-date override from daily_limits (null if none); taken = pending + confirmed bookings. */
  availability(packageId: number, destinationId: number, date: string): Promise<{ limit: number | null; taken: number }>
  /** Must check the limit and insert atomically. Throws FullyBookedError / DuplicateReferenceError. */
  createBooking(input: NewBooking, defaultLimit: number): Promise<BookingRecord>
  listForUser(userId: string): Promise<BookingRecord[]>
  findForUser(userId: string, reference: string): Promise<BookingRecord | null>

  // ---- admin ----
  /** Newest first. */
  listAll(limit: number): Promise<AdminBooking[]>
  findByReference(reference: string): Promise<AdminBooking | null>
  /**
   * Applies the change only if the booking still has the status and payment the admin was looking at.
   * Returns null when it was changed in the meantime (or does not exist).
   */
  updateBooking(
    reference: string,
    seen: { status: BookingRecord["status"]; paymentStatus: BookingRecord["paymentStatus"] },
    change: BookingChange,
  ): Promise<AdminBooking | null>
}