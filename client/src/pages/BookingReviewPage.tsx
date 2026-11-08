
import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { PageShell } from "../components/PageShell"
import { PriceBreakdown } from "../components/PriceBreakdown"
import { ApiError, apiFetch } from "../lib/api"
import { clearDraft, loadDraft } from "../lib/draft"
import { formatDate, peso } from "../lib/format"
import { paymentLabel, type Availability, type Booking, type PaymentMethod, type PriceQuote } from "../lib/types"

export default function BookingReviewPage() {
  const navigate = useNavigate()
  const [draft] = useState(loadDraft)
  const [quote, setQuote] = useState<PriceQuote | null>(null)
  const [avail, setAvail] = useState<Availability | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
    const [method, setMethod] = useState<PaymentMethod>("gcash")

  // Re-check price and availability in case anything changed.
  useEffect(() => {
    if (!draft) return

    const ctrl = new AbortController()

    apiFetch<PriceQuote>("/price/calculate", {
      method: "POST",
      body: {
        packageSlug: draft.packageSlug,
        guests: draft.guests,
        addonIds: draft.addonIds,
      },
      signal: ctrl.signal,
    })
      .then(setQuote)
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message))

    apiFetch<Availability>("/availability/check", {
      method: "POST",
      body: {
        packageSlug: draft.packageSlug,
        destinationSlug: draft.destinationSlug,
        date: draft.date,
        guests: draft.guests,
      },
      signal: ctrl.signal,
    })
      .then(setAvail)
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message))

    return () => ctrl.abort()
  }, [draft])

  if (!draft) return <Navigate to="/builder" replace />

  const submit = async () => {
    setBusy(true)
    setError(null)

    try {
      const booking = await apiFetch<Booking>("/bookings", {
        method: "POST",
        auth: true,
        body: {
          packageSlug: draft.packageSlug,
          destinationSlug: draft.destinationSlug,
          date: draft.date,
          guests: draft.guests,
          addonIds: draft.addonIds,
          paymentMethod: method,
        },
      })

      clearDraft()
      navigate(`/booking/confirmation/${booking.reference}`, { replace: true })
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Something went wrong. Please try again."
      )
      setBusy(false)
    }
  }

  const unavailable = avail !== null && !avail.available
  const ready = quote?.priceAvailable === true && avail?.available === true

  return (
    <PageShell title="Review booking">
      <div className="max-w-2xl mx-auto px-6">
        <span className="font-mono text-ink/60 text-xs tracking-widest">
          REVIEW
        </span>

        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-2">
          CHECK YOUR <span className="text-brand">BOOKING</span>
        </h1>

        <div className="mt-8 bg-white border-2 border-ink/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
            <dt className="text-ink/50">Package</dt>
            <dd className="font-bold text-right">{draft.packageName}</dd>

            <dt className="text-ink/50">Destination</dt>
            <dd className="font-bold text-right">{draft.destinationName}</dd>

            <dt className="text-ink/50">Date</dt>
            <dd className="font-bold text-right">{formatDate(draft.date)}</dd>

            <dt className="text-ink/50">Guests</dt>
            <dd className="font-bold text-right">{draft.guests}</dd>
          </dl>

          <div className="border-t border-ink/10 pt-5">
            <PriceBreakdown quote={quote} emptyText="Calculating price..." />
          </div>

          <fieldset className="border-t border-ink/10 pt-5">
            <legend className="font-mono text-xs tracking-widest text-ink/60 mb-3">PAYMENT</legend>
            <div className="space-y-2">
              {(Object.keys(paymentLabel) as PaymentMethod[]).map((m) => (
                <label
                  key={m}
                  className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                    method === m ? "border-brand bg-brand/10" : "border-ink/10 hover:border-ink/30"
                  }`}
                >
                  <input type="radio" name="payment" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-ink" />
                  <span className="font-bold text-sm">{paymentLabel[m]}</span>
                  <span className="ml-auto font-mono text-xs text-ink/50">
                    {m === "cash" ? "Pay when you arrive" : "Paid now"}
                  </span>
                </label>
              ))}
            </div>
            <p className="font-mono text-[11px] text-ink/50 mt-3">
              Demo payment only. No real money is charged and no card details are collected.
            </p>
          </fieldset>

          {unavailable && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-mono"
            >
              {avail?.reason}{" "}
              <Link to="/builder" className="underline font-bold">
                Change your trip
              </Link>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-mono"
            >
              {error}{" "}
              {error.toLowerCase().includes("fully booked") && (
                <Link to="/builder" className="underline font-bold">
                  Pick another date
                </Link>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/builder"
              className="text-center border-2 border-ink px-6 py-3.5 rounded-full font-bold text-sm hover:bg-ink hover:text-white transition-colors"
            >
              Edit trip
            </Link>

            <button
              onClick={submit}
              disabled={busy || !ready}
              className="flex-1 bg-brand text-ink px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy
                ? "Submitting..."
                : method === "cash"
                  ? "Submit booking"
                  : quote?.priceAvailable
                    ? `Pay ${peso(quote.total)} (demo) and submit`
                    : "Pay (demo) and submit"}
            </button>
          </div>

          <p className="font-mono text-[11px] text-ink/50 text-center">
            Submitting sends your booking request. Payment is not taken online yet.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
