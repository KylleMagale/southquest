
import { Link } from "react-router-dom"
import { ErrorState, PageShell } from "../components/PageShell"
import { StatusBadge } from "../components/StatusBadge"
import { useApi } from "../lib/api"
import { useAuth } from "../lib/AuthContext"
import { formatDate, peso } from "../lib/format"
import type { Booking } from "../lib/types"

export default function MyBookingPage() {
  const { user, profile, signOut } = useAuth()
  const { data, status, retry } = useApi<Booking[]>("/bookings/mine", { auth: true })
  const name = profile?.fullName?.trim() || user?.email || "camper"

  return (
    <PageShell title="My Booking">
      <div className="max-w-3xl mx-auto px-6">
        <span className="font-mono text-ink/60 text-xs tracking-widest">MY BOOKING</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-2">
          HELLO, <span className="text-brand">{name.split(" ")[0].toUpperCase()}</span>
        </h1>

        <div className="mt-8">
          {status === "loading" && (
            <div className="h-32 rounded-3xl bg-ink/5 animate-pulse" aria-busy="true" />
          )}

          {status === "error" && <ErrorState onRetry={retry} />}

          {status === "ok" && data && data.length === 0 && (
            <div className="border-2 border-dashed border-ink/15 rounded-3xl p-10 text-center">
              <h2 className="text-xl font-black tracking-tight">No bookings yet</h2>
              <p className="font-mono text-sm text-ink/60 mt-2">
                When you book a trip, it will show up here with its status.
              </p>
              <Link
                to="/builder"
                className="inline-block mt-6 bg-brand text-ink px-6 py-3 rounded-full font-bold text-sm"
              >
                Plan a trip
              </Link>
            </div>
          )}

          {status === "ok" && data && data.length > 0 && (
            <ul className="space-y-3">
              {data.map((b) => (
                <li key={b.reference}>
                  <Link
                    to={`/booking/confirmation/${b.reference}`}
                    className="block bg-white border-2 border-ink/10 hover:border-brand rounded-2xl p-5 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black tracking-widest">{b.reference}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="font-bold mt-2">
                      {b.packageName}{" "}
                      <span className="font-normal text-ink/60">
                        at {b.destinationName}
                      </span>
                    </p>
                    <p className="font-mono text-xs text-ink/60 mt-1">
                      {formatDate(b.date)} · {b.guests} guest
                      {b.guests === 1 ? "" : "s"} · {peso(b.totalPrice)} · {b.paymentStatus}
                    </p>
                  </Link>
                </li>
              ))}
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
