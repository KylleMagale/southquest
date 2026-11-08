import { Star } from "lucide-react"

/** Read-only star rating, e.g. 4 of 5. */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= Math.round(value) ? "fill-brand text-ink" : "text-ink/20"}
          aria-hidden
        />
      ))}
    </span>
  )
}

/** Clickable star rating for the review form. */
export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star width={28} height={28} className={n <= value ? "fill-brand text-ink" : "text-ink/25 hover:text-ink/50"} />
        </button>
      ))}
    </div>
  )
}