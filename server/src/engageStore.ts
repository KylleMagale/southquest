/** Contact-form inquiries and customer reviews. */

export type InquiryStatus = "new" | "read"
export type ReviewStatus = "pending" | "approved" | "hidden"

export interface NewInquiry {
  name: string
  email: string
  phone: string | null
  message: string
}

export interface Inquiry extends NewInquiry {
  id: number
  status: InquiryStatus
  createdAt: string
}

/** A review as its author sees it. */
export interface Review {
  id: number
  reference: string
  rating: number
  comment: string
  status: ReviewStatus
  createdAt: string
}

/** What the public Reviews page shows. Only the first name is ever exposed. */
export interface PublicReview {
  id: number
  rating: number
  comment: string
  firstName: string
  packageName: string
  createdAt: string
}

export interface AdminReview extends Review {
  customerName: string | null
  packageName: string
}

export class DuplicateReviewError extends Error {}

export interface EngageStore {
  createInquiry(input: NewInquiry): Promise<void>
  /** Newest first. */
  listInquiries(limit: number): Promise<Inquiry[]>
  setInquiryStatus(id: number, status: InquiryStatus): Promise<Inquiry | null>

  /** One review per booking. Throws DuplicateReviewError. Returns null if the user has no booking with that reference. */
  createReview(userId: string, reference: string, rating: number, comment: string): Promise<Review | null>
  listReviewsForUser(userId: string): Promise<Review[]>
  listPublicReviews(limit: number): Promise<PublicReview[]>
  listAllReviews(limit: number): Promise<AdminReview[]>
  setReviewStatus(id: number, status: ReviewStatus): Promise<AdminReview | null>
}