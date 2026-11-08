import { Link } from "react-router-dom"
import { ErrorState, LoadingState, PageHeading, PageShell } from "../components/PageShell"
import { Stars } from "../components/Stars"
import { useApi } from "../lib/api"
import { formatDate } from "../lib/format"
import type { PublicReview } from "../lib/types"

export default function ReviewsPage() {
  const { data, status, retry } = useApi<PublicReview[]>("/reviews")
  const average = data && data.length ? data.reduce((sum, r) => sum + r.rating, 0) / data.length : 0

  return (
    <PageShell title="Reviews">
      <PageHeading label="REVIEWS" first="WHAT CAMPERS" accent="SAY" intro="Honest feedback from guests who stayed with us." />

      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState onRetry={retry} />}

      {status === "ok" && data && data.length === 0 && (
        <div className="max-w-xl mx-auto px-6">
          <div className="border-2 border-dashed border-ink/15 rounded-3xl p-10 text-center">
            <h2 className="text-xl font-black tracking-tight">No reviews yet</h2>
            <p className="font-mono text-sm text-ink/60 mt-2">Be the first. After your trip you can review it from My Booking.</p>
            <Link to="/packages" className="inline-block mt-6 bg-brand text-ink px-6 py-3 rounded-full font-bold text-sm">
              See packages
            </Link>
          </div>
        </div>
      )}

      {status === "ok" && data && data.length > 0 && (
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-4xl font-black">{average.toFixed(1)}</span>
            <div>
              <Stars value={average} size={20} />
              <p className="font-mono text-xs text-ink/60 mt-1">
                {data.length} review{data.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <ul className="grid md:grid-cols-2 gap-4">
            {data.map((r) => (
              <li key={r.id} className="bg-white border-2 border-ink/10 rounded-2xl p-5">
                <Stars value={r.rating} />
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{r.comment}</p>
                <p className="font-mono text-xs text-ink/60 mt-4">
                  <span className="font-bold text-ink">{r.firstName}</span>
                  {r.packageName && <> · {r.packageName}</>} · {formatDate(r.createdAt.slice(0, 10))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageShell>
  )
}