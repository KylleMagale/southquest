import { useEffect, useState } from "react"
import { AdminHeader, btnOutline, btnPrimary } from "../components/AdminBits"
import { ErrorState, PageShell } from "../components/PageShell"
import { ApiError, apiFetch } from "../lib/api"
import type { Inquiry } from "../lib/types"

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([])
  const [state, setState] = useState<"loading" | "ok" | "error">("loading")
  const [tick, setTick] = useState(0)
  const [filter, setFilter] = useState<"new" | "all">("new")
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setState("loading")
    apiFetch<Inquiry[]>("/admin/inquiries", { auth: true, signal: ctrl.signal })
      .then((list) => {
        setItems(list)
        setState("ok")
      })
      .catch((e: Error) => e.name !== "AbortError" && setState("error"))
    return () => ctrl.abort()
  }, [tick])

  const mark = async (i: Inquiry, status: Inquiry["status"]) => {
    setBusy(i.id)
    setError(null)
    try {
      const updated = await apiFetch<Inquiry>(`/admin/inquiries/${i.id}`, { method: "PATCH", auth: true, body: { status } })
      setItems((list) => list.map((x) => (x.id === updated.id ? updated : x)))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  const unread = items.filter((i) => i.status === "new").length
  const shown = filter === "new" ? items.filter((i) => i.status === "new") : items

  return (
    <PageShell title="Admin: Inquiries">
      <div className="max-w-4xl mx-auto px-6">
        <AdminHeader title="INQUIR" accent="IES" note="Messages sent from the Contact page. Reply by email or phone, then mark them as read." />

        {state === "error" && <ErrorState onRetry={() => setTick((t) => t + 1)} />}

        {state !== "error" && (
          <>
            <div className="flex gap-2 mt-8" role="tablist">
              {(["new", "all"] as const).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-bold ${filter === f ? "bg-ink text-white" : "bg-ink/5 hover:bg-ink/10"}`}
                >
                  {f === "new" ? "New" : "All"}{" "}
                  <span className={filter === f ? "text-brand" : "text-ink/50"}>{f === "new" ? unread : items.length}</span>
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
                <h2 className="text-xl font-black tracking-tight">{items.length === 0 ? "No inquiries yet" : "All caught up"}</h2>
                <p className="font-mono text-sm text-ink/60 mt-2">New messages from the Contact page show up here.</p>
              </div>
            )}

            <ul className="space-y-4 mt-4">
              {shown.map((i) => (
                <li key={i.id} className="bg-white border-2 border-ink/10 rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">
                      {i.name}{" "}
                      {i.status === "new" && (
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-brand text-ink text-[10px] font-bold uppercase tracking-wide">New</span>
                      )}
                    </p>
                    <span className="font-mono text-[11px] text-ink/40">{new Date(i.createdAt).toLocaleString("en-PH")}</span>
                  </div>
                  <p className="font-mono text-xs text-ink/60 mt-1 break-all">
                    <a href={`mailto:${i.email}`} className="underline hover:text-ink">
                      {i.email}
                    </a>
                    {i.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${i.phone}`} className="underline hover:text-ink">
                          {i.phone}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="mt-3 text-sm whitespace-pre-line">{i.message}</p>
                  <div className="mt-4 pt-4 border-t border-ink/10">
                    {i.status === "new" ? (
                      <button className={btnPrimary} disabled={busy === i.id} onClick={() => mark(i, "read")}>
                        Mark as read
                      </button>
                    ) : (
                      <button className={btnOutline} disabled={busy === i.id} onClick={() => mark(i, "new")}>
                        Mark as new
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