
import { Link, useParams } from "react-router-dom"
import { ErrorState, LoadingState, NotFoundState, PageShell } from "../components/PageShell"
import { StatusBadge } from "../components/StatusBadge"
import { useApi } from "../lib/api"
import { formatDate, peso } from "../lib/format"
import type { Booking } from "../lib/types"

export default function BookingConfirmationPage() {
  const { reference = "" } = useParams()

  const { data, status, retry } = useApi<Booking>(
    `/bookings/${encodeURIComponent(reference)}`,
    { auth: true }
  )

  return (
    <PageShell title="Booking submitted">
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState onRetry={retry} />}

      {status === "not-found" && (
        <NotFoundState
          what="Booking"
          backTo="/my-booking"
          backLabel="Go to My Booking"
        />
      )}

      {status === "ok" && data && (
        <div className="max-w-2xl mx-auto px-6">
          <span className="font-mono text-ink/60 text-xs tracking-widest">
            BOOKING SUBMITTED
          </span>

          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-2">
            YOU'RE <span className="text-brand">ALL SET</span>
          </h1>

          <p className="font-mono text-sm text-ink/60 mt-3">
            Keep your booking reference. You can follow this booking on My Booking.
          </p>

          <div className="mt-8 bg-ink text-white rounded-3xl p-6 md:p-8 text-center">
            <span className="font-mono text-xs tracking-widest text-white/60">
              BOOKING REFERENCE
            </span>

            <div className="text-4xl md:text-5xl font-black tracking-widest text-brand mt-2 select-all">
              {data.reference}
            </div>

            <div className="mt-4">
              <StatusBadge status={data.status} />
            </div>
          </div>

          <div className="mt-6 bg-white border-2 border-ink/10 rounded-3xl p-6 md:p-8">
            <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
              <dt className="text-ink/50">Package</dt>
              <dd className="font-bold text-right">{data.packageName}</dd>

              <dt className="text-ink/50">Destination</dt>
              <dd className="font-bold text-right">{data.destinationName}</dd>

              <dt className="text-ink/50">Date</dt>
              <dd className="font-bold text-right">{formatDate(data.date)}</dd>

              <dt className="text-ink/50">Guests</dt>
              <dd className="font-bold text-right">{data.guests}</dd>

              {data.addons.length > 0 && (
                <>
                  <dt className="text-ink/50">Add-ons</dt>
                  <dd className="font-bold text-right">{data.addons.join(", ")}</dd>
                </>
              )}

              <dt className="text-ink/50">Payment</dt>
              <dd className="font-bold text-right capitalize">{data.paymentStatus}</dd>

              <dt className="text-ink/50 pt-3 border-t border-ink/10">Total</dt>
              <dd className="font-black text-xl text-right pt-3 border-t border-ink/10">
                {peso(data.totalPrice)}
              </dd>
            </dl>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/my-booking"
              className="text-center bg-brand text-ink px-6 py-3.5 rounded-full font-bold text-sm"
            >
              View my bookings
            </Link>

            <Link
              to="/"
              className="text-center border-2 border-ink px-6 py-3.5 rounded-full font-bold text-sm hover:bg-ink hover:text-white transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      )}
    </PageShell>
  )
}
