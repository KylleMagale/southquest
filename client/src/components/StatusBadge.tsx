
import type { Booking } from "../lib/types"

const styles: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-brand text-ink",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-ink/10 text-ink/60",
}

export function StatusBadge({ status }: { status: Booking["status"] }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${styles[status]}`}
    >
      {status}
    </span>
  )
}
