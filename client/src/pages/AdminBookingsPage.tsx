import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ErrorState, PageShell } from "../components/PageShell"
import { PaymentBadge, StatusBadge } from "../components/StatusBadge"
import { apiFetch, ApiError } from "../lib/api"
import { formatDate, peso } from "../lib/format"
import type { AdminBooking } from "../lib/types"

type Tab = "all" | AdminBooking["status"]
type Sort = "newest" | "trip"

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "rejected", label: "Rejected" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
]

type Change = { status?: AdminBooking["status"]; paymentStatus?: AdminBooking["paymentStatus"] }

const button = "px-4 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
const primary = `${button} bg-brand text-ink hover:bg-brand-deep`
const outline = `${button} border-2 border-ink/20 text-ink hover:border-ink`
const danger = `${button} border-2 border-red-300 text-red-700 hover:bg-red-50`

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState<"loading" | "ok" | "error">("loading")
  const [tick, setTick] = useState(0)

  const [tab, setTab] = useState<Tab>("pending")
  const [query, setQuery] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [sort, setSort] = useState<Sort>("newest")

  const [busy, setBusy] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading("loading")

    apiFetch<AdminBooking[]>("/admin/bookings", { auth: true, signal: ctrl.signal })
      .then((list) => {
        setBookings(list)
        setLoading("ok")
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setLoading("error")
      })

    return () => ctrl.abort()
  }, [tick])

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: bookings.length, pending: 0, confirmed: 0, rejected: 0, cancelled: 0 }
    for (const b of bookings) c[b.status]++
    return c
  }, [bookings])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()

    const list = bookings.filter((b) => {
      if (tab !== "all" && b.status !== tab) return false
      if (from && b.date < from) return false
      if (to && b.date > to) return false
      if (!q) return true

      return [b.reference, b.customer.name, b.customer.email, b.customer.phone, b.packageName, b.destinationName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })

    // The server sends newest first already.
    return sort === "trip" ? [...list].sort((a, b) => a.date.localeCompare(b.date)) : list
  }, [bookings, tab, query, from, to, sort])

  const act = async (b: AdminBooking, change: Change, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return

    setBusy(b.reference)
    setNotice(null)
    setErrors((e) => ({ ...e, [b.reference]: "" }))

    try {
      const updated = await apiFetch<AdminBooking>(`/admin/bookings/${encodeURIComponent(b.reference)}`, {
        method: "PATCH",
        body: change,
        auth: true,
      })
      setBookings((list) => list.map((x) => (x.reference === updated.reference ? updated : x)))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      if (err instanceof ApiError && err.status === 409) {
        // The booking moved to another tab, so say it at the top of the page, then show the latest state.
        setNotice(`${b.reference}: ${message} The list has been refreshed.`)
        setTick((t) => t + 1)
      } else {
        setErrors((e) => ({ ...e, [b.reference]: message }))
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <PageShell title="Admin: Bookings">
      <div className="max-w-5xl mx-auto px-6">
        <Link to="/admin" className="font-mono text-xs text-ink/60 hover:text-ink">
          ← Dashboard
        </Link>

        <span className="block font-mono text-ink/60 text-xs tracking-widest mt-4">ADMIN</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-2">
          BOOK<span className="text-brand">INGS</span>
        </h1>

        {loading === "error" && <ErrorState onRetry={() => setTick((t) => t + 1)} />}

        {loading !== "error" && (
          <>
            {notice && (
              <div
                role="alert"
                className="mt-8 flex items-start justify-between gap-4 bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-2xl px-4 py-3 text-sm"
              >
                <span>{notice}</span>
                <button onClick={() => setNotice(null)} className="font-bold underline shrink-0">
                  Dismiss
                </button>
              </div>
            )}

            <div className={`flex flex-wrap gap-2 ${notice ? "mt-4" : "mt-8"}`} role="tablist" aria-label="Filter by status">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    tab === t.id ? "bg-ink text-white" : "bg-ink/5 text-ink hover:bg-ink/10"
                  }`}
                >
                  {t.label}{" "}
                  <span className={tab === t.id ? "text-brand" : "text-ink/50"}>{counts[t.id]}</span>
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <label className="block sm:col-span-2 lg:col-span-1">
                <span className="block text-xs font-bold mb-1">Search</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, phone, email, ref"
                  className="w-full border-2 border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-bold mb-1">Trip date from</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full border-2 border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-bold mb-1">Trip date to</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full border-2 border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-bold mb-1">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="w-full border-2 border-ink/10 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand"
                >
                  <option value="newest">Newest booked</option>
                  <option value="trip">Trip date, soonest first</option>
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between mt-4 font-mono text-xs text-ink/60">
              <span>
                Showing {shown.length} of {bookings.length} bookings
              </span>
              {(query || from || to) && (
                <button
                  onClick={() => {
                    setQuery("")
                    setFrom("")
                    setTo("")
                  }}
                  className="underline hover:text-ink"
                >
                  Clear search and dates
                </button>
              )}
            </div>

            {loading === "loading" && <div className="h-40 mt-4 rounded-3xl bg-ink/5 animate-pulse" aria-busy="true" />}

            {loading === "ok" && shown.length === 0 && (
              <div className="border-2 border-dashed border-ink/15 rounded-3xl p-10 text-center mt-4">
                <h2 className="text-xl font-black tracking-tight">
                  {bookings.length === 0 ? "No bookings yet" : "No bookings match"}
                </h2>
                <p className="font-mono text-sm text-ink/60 mt-2">
                  {bookings.length === 0
                    ? "New bookings from customers will show up here."
                    : "Try another status tab or clear the search."}
                </p>
              </div>
            )}

            <ul className="space-y-4 mt-4">
              {shown.map((b) => {
                const working = busy === b.reference
                const final = b.status === "rejected" || b.status === "cancelled"

                return (
                  <li key={b.reference} className="bg-white border-2 border-ink/10 rounded-2xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black tracking-widest">{b.reference}</span>
                        <StatusBadge status={b.status} />
                        <PaymentBadge status={b.paymentStatus} />
                      </div>
                      <span className="text-lg font-black">{peso(b.totalPrice)}</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="font-bold">
                          {b.packageName} <span className="font-normal text-ink/60">at {b.destinationName}</span>
                        </p>
                        <p className="font-mono text-xs text-ink/60 mt-1">
                          {formatDate(b.date)} · {b.guests} {b.guests === 1 ? "guest" : "guests"}
                        </p>
                        {b.addons.length > 0 && (
                          <p className="font-mono text-xs text-ink/60 mt-1">Add-ons: {b.addons.join(", ")}</p>
                        )}
                      </div>

                      <div>
                        <p className="font-bold">{b.customer.name || "Name not set"}</p>
                        <p className="font-mono text-xs text-ink/60 mt-1 break-all">
                          {b.customer.phone ? (
                            <a href={`tel:${b.customer.phone}`} className="underline hover:text-ink">
                              {b.customer.phone}
                            </a>
                          ) : (
                            "No phone"
                          )}
                          {" · "}
                          {b.customer.email ? (
                            <a href={`mailto:${b.customer.email}`} className="underline hover:text-ink">
                              {b.customer.email}
                            </a>
                          ) : (
                            "No email"
                          )}
                        </p>
                        <p className="font-mono text-[11px] text-ink/40 mt-1">
                          Booked {new Date(b.createdAt).toLocaleString("en-PH")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-ink/10">
                      {b.status === "pending" && (
                        <>
                          <button className={primary} disabled={working} onClick={() => act(b, { status: "confirmed" })}>
                            Confirm
                          </button>
                          <button
                            className={danger}
                            disabled={working}
                            onClick={() =>
                              act(
                                b,
                                { status: "rejected" },
                                `Reject booking ${b.reference}? The customer will see it as rejected and the date opens up again.`,
                              )
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {b.status === "confirmed" && b.paymentStatus === "unpaid" && (
                        <button className={primary} disabled={working} onClick={() => act(b, { paymentStatus: "paid" })}>
                          Mark as paid
                        </button>
                      )}

                      {b.status === "confirmed" && b.paymentStatus === "paid" && (
                        <>
                          <button
                            className={outline}
                            disabled={working}
                            onClick={() =>
                              act(b, { paymentStatus: "refunded" }, `Mark ${b.reference} as refunded? This can't be undone.`)
                            }
                          >
                            Mark as refunded
                          </button>
                          <button className={outline} disabled={working} onClick={() => act(b, { paymentStatus: "unpaid" })}>
                            Undo paid
                          </button>
                        </>
                      )}

                      {b.status === "confirmed" && (
                        <button
                          className={danger}
                          disabled={working}
                          onClick={() =>
                            act(
                              b,
                              { status: "cancelled" },
                              b.paymentStatus === "paid"
                                ? `Cancel booking ${b.reference}? It is marked paid, so remember to refund the customer. The date opens up again.`
                                : `Cancel booking ${b.reference}? The date opens up again.`,
                            )
                          }
                        >
                          Cancel booking
                        </button>
                      )}

                      {final && <span className="font-mono text-xs text-ink/50">This booking is closed. No further actions.</span>}

                      {working && <span className="font-mono text-xs text-ink/60">Saving...</span>}
                    </div>

                    {errors[b.reference] && (
                      <p role="alert" className="mt-3 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-2">
                        {errors[b.reference]}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>

            {bookings.length >= 500 && (
              <p className="font-mono text-xs text-ink/50 mt-4">Showing the latest 500 bookings.</p>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}