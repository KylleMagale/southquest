import { useEffect, useState, type FormEvent } from "react"
import { ErrorState, PageShell } from "../components/PageShell"
import { AdminHeader, btnOutline, btnPrimary, Field, FormError, inputClass, Notice } from "../components/AdminBits"
import { apiFetch, ApiError, useApi } from "../lib/api"
import { formatDate, tomorrowISO } from "../lib/format"
import type { AdminDestination, AdminPackage, LimitsReply } from "../lib/types"

export default function AdminAvailabilityPage() {
  const packages = useApi<AdminPackage[]>("/admin/packages", { auth: true })
  const destinations = useApi<AdminDestination[]>("/admin/destinations", { auth: true })

  const [packageId, setPackageId] = useState<number | null>(null)
  const [destinationId, setDestinationId] = useState<number | null>(null)

  const [reply, setReply] = useState<LimitsReply | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [tick, setTick] = useState(0)

  const [date, setDate] = useState("")
  const [max, setMax] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const pkg = packages.data?.find((p) => p.id === packageId) ?? null
  const options = (destinations.data ?? []).filter((d) => pkg?.destinationIds.includes(d.id))

  // Start on the first package that is offered somewhere.
  useEffect(() => {
    if (packageId === null && packages.data) {
      const first = packages.data.find((p) => p.destinationIds.length > 0)
      if (first) setPackageId(first.id)
    }
  }, [packageId, packages.data])

  // Keep the destination valid for the chosen package.
  useEffect(() => {
    if (!pkg) return
    if (destinationId === null || !pkg.destinationIds.includes(destinationId)) {
      setDestinationId(pkg.destinationIds[0] ?? null)
    }
  }, [pkg, destinationId])

  useEffect(() => {
    if (packageId === null || destinationId === null || !pkg?.destinationIds.includes(destinationId)) {
      setReply(null)
      return
    }
    const ctrl = new AbortController()
    setLoadError(false)
    apiFetch<LimitsReply>(`/admin/limits?packageId=${packageId}&destinationId=${destinationId}`, { auth: true, signal: ctrl.signal })
      .then(setReply)
      .catch((err: Error) => {
        if (err.name !== "AbortError") setLoadError(true)
      })
    return () => ctrl.abort()
  }, [packageId, destinationId, pkg, tick])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (packageId === null || destinationId === null) return
    setError(null)
    setSaving(true)
    try {
      await apiFetch("/admin/limits", {
        method: "PUT",
        auth: true,
        body: { packageId, destinationId, date, maxBookings: max.trim() === "" ? null : Number(max) },
      })
      setNotice(`Saved: ${formatDate(date)} now allows ${max} ${Number(max) === 1 ? "booking" : "bookings"}.`)
      setDate("")
      setMax("")
      setTick((t) => t + 1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (day: string) => {
    if (packageId === null || destinationId === null) return
    if (!window.confirm(`Remove the special limit for ${formatDate(day)}? The normal limit applies again.`)) return
    try {
      await apiFetch(`/admin/limits?packageId=${packageId}&destinationId=${destinationId}&date=${day}`, { method: "DELETE", auth: true })
      setNotice(`Removed the special limit for ${formatDate(day)}.`)
      setTick((t) => t + 1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    }
  }

  const failed = packages.status === "error" || destinations.status === "error"

  return (
    <PageShell title="Admin: Availability">
      <div className="max-w-5xl mx-auto px-6">
        <AdminHeader
          title="AVAIL"
          accent="ABILITY"
          note="Choose how many bookings a package can take on a date. Use 0 to close a date. Dates without a special limit use the normal daily limit."
        />

        {failed && <ErrorState onRetry={() => { packages.retry(); destinations.retry() }} />}

        {notice && <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>}

        {packages.data && destinations.data && !failed && (
          <>
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <Field label="Package">
                <select
                  value={packageId ?? ""}
                  onChange={(e) => {
                    setPackageId(Number(e.target.value))
                    setNotice(null)
                    setError(null)
                  }}
                  className={inputClass}
                >
                  {packages.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Destination">
                <select
                  value={destinationId ?? ""}
                  onChange={(e) => {
                    setDestinationId(Number(e.target.value))
                    setNotice(null)
                    setError(null)
                  }}
                  className={inputClass}
                  disabled={options.length === 0}
                >
                  {options.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {options.length === 0 && (
              <p className="font-mono text-sm text-ink/60 mt-6">
                This package isn't offered at any destination yet. Link it on the Packages page first.
              </p>
            )}

            {reply && (
              <>
                <p className="font-mono text-sm text-ink/60 mt-6">
                  Normal limit: <strong className="text-ink">{reply.defaultLimit}</strong> bookings per day for this package at this destination.
                </p>

                <form onSubmit={save} className="bg-white border-2 border-ink rounded-3xl p-6 mt-4 space-y-4">
                  <h2 className="text-xl font-black tracking-tight">Set a limit for one date</h2>
                  <div className="grid sm:grid-cols-3 gap-4 items-end">
                    <Field label="Date">
                      <input type="date" min={tomorrowISO()} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Max bookings" hint="0 closes the date.">
                      <input type="number" min={0} max={100} step={1} value={max} onChange={(e) => setMax(e.target.value)} className={inputClass} required />
                    </Field>
                    <button type="submit" disabled={saving} className={btnPrimary}>
                      {saving ? "Saving..." : "Set limit"}
                    </button>
                  </div>
                  {error && <FormError>{error}</FormError>}
                </form>

                <h2 className="text-xl font-black tracking-tight mt-8">Special limits coming up</h2>
                {loadError && <ErrorState onRetry={() => setTick((t) => t + 1)} />}
                <ul className="space-y-3 mt-4">
                  {reply.limits.map((l) => (
                    <li key={l.date} className="bg-white border-2 border-ink/10 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{formatDate(l.date)}</p>
                        <p className="font-mono text-xs text-ink/60 mt-1">
                          {l.maxBookings === 0 ? "Closed" : `Limit ${l.maxBookings}`} · {l.taken} booked
                          {l.taken > l.maxBookings ? " (already over this limit; existing bookings stay)" : ""}
                        </p>
                      </div>
                      <button onClick={() => remove(l.date)} className={btnOutline} aria-label={`Remove limit for ${l.date}`}>
                        Remove
                      </button>
                    </li>
                  ))}
                  {reply.limits.length === 0 && (
                    <li className="border-2 border-dashed border-ink/15 rounded-3xl p-8 text-center font-mono text-sm text-ink/60">
                      No special limits. Every date uses the normal limit.
                    </li>
                  )}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}