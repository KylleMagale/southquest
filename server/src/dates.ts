
/**
 * Helpers for validating booking dates.
 * Dates use YYYY-MM-DD format.
 */

/** Returns true when value is a real calendar date in YYYY-MM-DD format. */
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

/** Returns today's date in YYYY-MM-DD format. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Returns tomorrow's date in YYYY-MM-DD format. */
export function tomorrowISO(): string {
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return tomorrow.toISOString().slice(0, 10)
}

/** Returns true if the date is today or later. */
export function isTodayOrFuture(value: string): boolean {
  return isValidDate(value) && value >= todayISO()
}
