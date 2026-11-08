import { useEffect, useState } from "react"
import { AdminHeader, btnOutline, btnPrimary } from "../components/AdminBits"
import { ErrorState, PageShell } from "../components/PageShell"
import { Stars } from "../components/Stars"
import { ApiError, apiFetch } from "../lib/api"
import type { AdminReview } from "../lib/types"

type Status = AdminReview["status"]
const TABS: { id: Status | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "hidden", label: "Hidden" },
  { id: "all", label: "All" },
]
const pill: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  hidden: "bg-ink/10 text-ink/60",
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<AdminReview[]>([])
  const [state, setState] = useState<"loading" | "ok" | "error">("loading")
  const [tick, setTick] = useState(0)
  const [tab, setTab] = useState<Status | "all">("pending")
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setState("loading")
    apiFetch<AdminReview[]>("/admin/reviews", { auth: true, signal: ctrl.signal })
      .then((list) => {
        setItems(list)
        setState("ok")
      })
      .catch((e: Error) => e.name !== "AbortError" && setState("error"))
    return () => ctrl.abort()
  }, [tick])

  const setStatus = async (r: AdminReview, status: Status) => {
    setBusy(r.id)
    setError(null)
    try {
      const updated = await apiFetch<AdminReview>(`/admin/reviews/${r.id}`, { method: "PATCH", auth: true, body: { status } })
      setItems((list) => list.map((x) => (x.id === updated.id ? updated : x)))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  const count = (t: Status | "all") => (t === "all" ? items.length : items.filter((r) => r.status === t).length)
  const shown = tab === "all" ? items : items.filter((r) => r.status === tab)

  return (
    <PageShell title="Admin: Reviews">
      <div className="max-w-4xl mx-auto px-6">
        <AdminHeader title="REVI" accent="EWS" note="Customer reviews start as pending. Only approved reviews appear on the Reviews page." />

        {state === "error" && <ErrorState onRetry={() => setTick((t) => t + 1)} />}

        {state !== "error" && (
          <>
            <div className="flex flex-wrap gap-2 mt-8" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold ${tab === t.id ? "bg-ink text-white" : "bg-ink/5 hover:bg-ink/10"}`}
                >
                  {t.label} <span className={tab === t.id ? "text-brand" : "text-ink/50"}>{count(t.id)}</span>
                </button>
              ))}
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-700 font-mono">
                {error}
              </p>
            )}

            {state === "loading" && <div className="h-32 mt-4 rounded-3xl bg-ink/5 animate-pulse" aria-busy="true" />}

            {state === "ok" && shown.length === 0 && (
              <div className="border-2 border-dashed border-ink/15 rounded-3xl p-10 text-center mt-4">
                <h2 className="text-xl font-black tracking-tight">Nothing here</h2>
                <p className="font-mono text-sm text-ink/60 mt-2">Reviews from customers show up here for you to approve.</p>
              </div>
            )}

            <ul className="space-y-4 mt-4">
              {shown.map((r) => (
                <li key={r.id} className="bg-white border-2 border-ink/10 rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Stars value={r.rating} />
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${pill[r.status]}`}>{r.status}</span>
                    </div>
                    <span className="font-mono text-[11px] text-ink/40">{new Date(r.createdAt).toLocaleString("en-PH")}</span>
                  </div>
                  <p className="mt-3 text-sm whitespace-pre-line">{r.comment}</p>
                  <p className="font-mono text-xs text-ink/60 mt-3">
                    {r.customerName || "Name not set"} · {r.packageName} · {r.reference}
                  </p>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-ink/10">
                    {r.status !== "approved" && (
                      <button className={btnPrimary} disabled={busy === r.id} onClick={() => setStatus(r, "approved")}>
                        Approve
                      </button>
                    )}
                    {r.status !== "hidden" && (
                      <button className={btnOutline} disabled={busy === r.id} onClick={() => setStatus(r, "hidden")}>
                        Hide
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </PageShell>
  )
}