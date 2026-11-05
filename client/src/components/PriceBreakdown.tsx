
import { peso } from "../lib/format"
import type { PriceQuote } from "../lib/types"

export function PriceBreakdown({
  quote,
  emptyText = "Choose a package to see the price.",
}: {
  quote: PriceQuote | null
  emptyText?: string
}) {
  if (!quote) {
    return (
      <p className="font-mono text-xs text-ink/50">
        {emptyText}
      </p>
    )
  }

  if (!quote.priceAvailable) {
    return (
      <p className="font-mono text-xs text-amber-700">
        {"reason" in quote ? quote.reason : "Price unavailable."}
      </p>
    )
  }

  const validQuote =
    Array.isArray(quote.lines) &&
    quote.lines.every(
      (line) =>
        line &&
        typeof line.total === "number" &&
        Number.isFinite(line.total) &&
        typeof line.quantity === "number" &&
        typeof line.unitPrice === "number"
    ) &&
    typeof quote.total === "number" &&
    Number.isFinite(quote.total)

  if (!validQuote) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <p className="font-bold text-amber-800 text-sm">
          We couldn't calculate this package price.
        </p>
        <p className="font-mono text-xs text-amber-700 mt-1">
          The pricing information is incomplete.
        </p>
      </div>
    )
  }

  return (
    <div>
      <ul className="space-y-3">
        {quote.lines.map((line, i) => (
          <li
            key={`${line.label}-${i}`}
            className="flex justify-between gap-3 font-mono text-xs"
          >
            <div>
              <p>{line.label}</p>
              <p className="text-ink/40 mt-1">
                {line.quantity} × {peso(line.unitPrice)}
              </p>
            </div>

            <span className="font-bold shrink-0">
              {peso(line.total)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-baseline border-t border-ink/10 mt-3 pt-3">
        <span className="font-black">Total</span>
        <span className="text-2xl font-black tracking-tight">
          {peso(quote.total)}
        </span>
      </div>
    </div>
  )
}
