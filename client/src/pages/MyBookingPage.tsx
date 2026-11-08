import { useState } from "react"
import { Link } from "react-router-dom"
import { ErrorState, PageShell } from "../components/PageShell"
import { StarInput, Stars } from "../components/Stars"
import { StatusBadge } from "../components/StatusBadge"
import { ApiError, apiFetch, useApi } from "../lib/api"
import { useAuth } from "../lib/AuthContext"
import { formatDate, peso } from "../lib/format"
import { paymentLabel, type Booking, type Review } from "../lib/types"

function ReviewBox({ booking, onSaved }: { booking: Booking; onSaved: (r: Review) => void }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (booking.review) {
    return (
      <div className="mt-3 pt-3 border-t border-ink/10 text-sm">
        <div className="flex items-center gap-2">
          <Stars value={booking.review.rating} />
          <span className="font-mono text-xs text-ink/60">
            {booking.review.status === "approved"
              ? "Your review is on the website."
              : booking.review.status === "hidden"
                ? "Your review isn't shown on the website."
                : "Thanks! Your review will show once we approve it."}
          </span>
        </div>
      </div>
    )
  }

  if (!booking.reviewable) return null

  const submit = async () => {
    if (rating < 1) return setError("Please choose a star rating.")
    setBusy(true)
    setError(null)
    try {
      const saved = await apiFetch<Review>(`/bookings/${encodeURIComponent(booking.reference)}/review`, {
        method: "POST",
        auth: true,
        body: { rating, comment },
      })
      onSaved(saved)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-ink/10">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm font-bold underline">
          Leave a review
        </button>
      ) : (
        <div className="space-y-3">
          <StarInput value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="How was your trip?"
            aria-label="Your review"
            className="w-full border-2 border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand"
          />
          {error && (
            <p role="alert" className="text-sm text-red-700 font-mono">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={busy}
              className="bg-brand text-ink px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50"
            >
              {busy ? "Sending..." : "Send review"}
            </button>
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-full text-sm font-bold border-2 border-ink/20">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyBookingPage() {
  const { user, profile, signOut } = useAuth()
  const { data, status, retry } = useApi<Booking[]>("/bookings/mine", { auth: true })
  const [saved, setSaved] = useState<Record<string, Review>>({})
  const name = profile?.fullName?.trim() || user?.email || "camper"

  return (
    <PageShell title="My Booking">
      <div className="max-w-3xl mx-auto px-6">
        <span className="font-mono text-ink/60 text-xs tracking-widest">MY BOOKING</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-2">
          HELLO, <span className="text-brand">{name.split(" ")[0].toUpperCase()}</span>
        </h1>

        <div className="mt-8">
          {status === "loading" && <div className="h-32 rounded-3xl bg-ink/5 animate-pulse" aria-busy="true" />}

          {status === "error" && <ErrorState onRetry={retry} />}

          {status === "ok" && data && data.length === 0 && (
            <div className="border-2 border-dashed border-ink/15 rounded-3xl p-10 text-center">
              <h2 className="text-xl font-black tracking-tight">No bookings yet</h2>
              <p className="font-mono text-sm text-ink/60 mt-2">When you book a trip, it will show up here with its status.</p>
              <Link to="/builder" className="inline-block mt-6 bg-brand text-ink px-6 py-3 rounded-full font-bold text-sm">
                Plan a trip
              </Link>
            </div>
          )}

          {status === "ok" && data && data.length > 0 && (
            <ul className="space-y-3">
              {data.map((b0) => {
                const b: Booking = saved[b0.reference] ? { ...b0, review: saved[b0.reference], reviewable: false } : b0
                return (
                  <li key={b.reference} className="bg-white border-2 border-ink/10 rounded-2xl p-5">
                    <Link to={`/booking/confirmation/${b.reference}`} className="block hover:opacity-80 transition-opacity">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-black tracking-widest">{b.reference}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="font-bold mt-2">
                        {b.packageName} <span className="font-normal text-ink/60">at {b.destinationName}</span>
                      </p>
                      <p className="font-mono text-xs text-ink/60 mt-1">
                        {formatDate(b.date)} · {b.guests} guest{b.guests === 1 ? "" : "s"} · {peso(b.totalPrice)} · {b.paymentStatus}
                        {b.paymentMethod && ` (${paymentLabel[b.paymentMethod]})`}
                      </p>
                    </Link>
                    <ReviewBox booking={b} onSaved={(r) => setSaved((m) => ({ ...m, [b.reference]: r }))} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between font-mono text-xs text-ink/60">
          <span>Signed in as {user?.email}</span>
          <button onClick={signOut} className="font-bold text-ink underline">
            Log out
          </button>
        </div>
      </div>
    </PageShell>
  )
}