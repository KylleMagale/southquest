// Dates are plain "YYYY-MM-DD" strings (no time zones to get wrong).
// "Today" is taken in Philippine time, since the campsites are in Cebu.

export function todayInManila(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
}

export function isValidISODate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Earliest bookable date: tomorrow (change the 1 if you want more lead time). */
export function minBookableDate(today: string): string {
  return addDays(today, 1)
}