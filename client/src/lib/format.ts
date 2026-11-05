
export function peso(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) {
    return "Price unavailable"
  }

  const whole = Number.isInteger(n)

  return `₱${n.toLocaleString("en-PH", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Earliest bookable date (tomorrow, Philippine time). */
export function tomorrowISO(): string {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  })

  const d = new Date(`${today}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)

  return d.toISOString().slice(0, 10)
}
