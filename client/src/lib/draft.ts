// The trip a visitor is building.
// Kept in sessionStorage so it survives the login step.
export interface BookingDraft {
  packageSlug: string
  packageName: string
  destinationSlug: string
  destinationName: string
  date: string
  guests: number
  addonIds: number[]
}

const KEY = "sq_booking_draft"

export function saveDraft(draft: BookingDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Storage unavailable: the flow still works,
    // but the draft won't survive a reload.
  }
}

export function loadDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY)

    if (!raw) return null

    const d = JSON.parse(raw) as Partial<BookingDraft>

    if (
      typeof d.packageSlug === "string" &&
      typeof d.destinationSlug === "string" &&
      typeof d.date === "string" &&
      typeof d.guests === "number" &&
      Array.isArray(d.addonIds)
    ) {
      return d as BookingDraft
    }
  } catch {
    // Ignore invalid or unavailable storage.
  }

  return null
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Ignore unavailable storage.
  }
}