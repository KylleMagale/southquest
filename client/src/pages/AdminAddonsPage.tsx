import { useEffect, useRef, useState, type FormEvent } from "react"
import { ErrorState, PageShell } from "../components/PageShell"
import {
  AdminHeader,
  btnOutline,
  btnPrimary,
  Field,
  FormError,
  inputClass,
  Notice,
  numberOrNull,
  StatusPill,
  StatusSelect,
} from "../components/AdminBits"
import { apiFetch, ApiError, useApi } from "../lib/api"
import { peso } from "../lib/format"
import type { AdminAddon, ContentStatus } from "../lib/types"

interface FormState {
  name: string
  type: AdminAddon["type"]
  price: string
  priceType: AdminAddon["priceType"]
  status: ContentStatus
}

const blank: FormState = { name: "", type: "meal", price: "", priceType: "per_guest", status: "active" }

const fromAddon = (a: AdminAddon): FormState => ({
  name: a.name,
  type: a.type,
  price: String(a.price),
  priceType: a.priceType,
  status: a.status,
})

function AddonForm({
  existing,
  onSaved,
  onCancel,
}: {
  existing: AdminAddon | null
  onSaved: (saved: AdminAddon) => void
  onCancel: () => void
}) {
  const [f, setF] = useState<FormState>(existing ? fromAddon(existing) : blank)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const top = useRef<HTMLFormElement>(null)

  useEffect(() => {
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setF((s) => ({ ...s, [key]: value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const body = { ...f, price: numberOrNull(f.price) }
      const saved = existing
        ? await apiFetch<AdminAddon>(`/admin/addons/${existing.id}`, { method: "PATCH", body, auth: true })
        : await apiFetch<AdminAddon>("/admin/addons", { method: "POST", body, auth: true })
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={top} onSubmit={submit} className="bg-white border-2 border-ink rounded-3xl p-6 mt-8 space-y-5 scroll-mt-28">
      <h2 className="text-2xl font-black tracking-tight">{existing ? `Edit ${existing.name}` : "New add-on"}</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name">
          <input value={f.name} onChange={(e) => set("name", e.target.value)} className={inputClass} maxLength={60} required />
        </Field>
        <Field label="Type" hint="Meals are listed in the meal options at booking.">
          <select value={f.type} onChange={(e) => set("type", e.target.value as FormState["type"])} className={inputClass}>
            <option value="meal">Meal</option>
            <option value="extra">Extra</option>
          </select>
        </Field>
        <Field label="Price (₱)">
          <input type="number" min={0} step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} className={inputClass} required />
        </Field>
        <Field label="Price is charged">
          <select value={f.priceType} onChange={(e) => set("priceType", e.target.value as FormState["priceType"])} className={inputClass}>
            <option value="per_guest">Per guest</option>
            <option value="per_booking">Once per booking</option>
          </select>
        </Field>
      </div>

      <StatusSelect value={f.status} onChange={(v) => set("status", v)} />

      {existing && (
        <p className="font-mono text-xs text-ink/60">A new price only applies to new bookings.</p>
      )}

      {error && <FormError>{error}</FormError>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving..." : existing ? "Save changes" : "Create add-on"}
        </button>
        <button type="button" onClick={onCancel} className={btnOutline}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function AdminAddonsPage() {
  const addons = useApi<AdminAddon[]>("/admin/addons", { auth: true })
  const [editing, setEditing] = useState<AdminAddon | "new" | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <PageShell title="Admin: Add-ons">
      <div className="max-w-5xl mx-auto px-6">
        <AdminHeader title="ADD" accent="-ONS" note="Meals and extras customers can add when they book, like breakfast or firewood." />

        {addons.status === "error" && <ErrorState onRetry={addons.retry} />}

        {notice && <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>}

        {addons.data && (
          <>
            {editing ? (
              <AddonForm
                key={editing === "new" ? "new" : editing.id}
                existing={editing === "new" ? null : editing}
                onCancel={() => setEditing(null)}
                onSaved={(saved) => {
                  setEditing(null)
                  setNotice(`Saved ${saved.name}.`)
                  addons.retry()
                }}
              />
            ) : (
              <button onClick={() => setEditing("new")} className={`${btnPrimary} mt-8`}>
                + Add an add-on
              </button>
            )}

            <ul className="space-y-4 mt-8">
              {addons.data.map((a) => (
                <li key={a.id} className="bg-white border-2 border-ink/10 rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight">{a.name}</h2>
                      <StatusPill status={a.status} />
                    </div>
                    <button onClick={() => setEditing(a)} className={btnOutline} aria-label={`Edit ${a.name}`}>
                      Edit
                    </button>
                  </div>
                  <p className="font-mono text-xs text-ink/60 mt-2">
                    {a.type === "meal" ? "Meal" : "Extra"} · {peso(a.price)} {a.priceType === "per_guest" ? "per guest" : "per booking"}
                  </p>
                </li>
              ))}
              {addons.data.length === 0 && (
                <li className="border-2 border-dashed border-ink/15 rounded-3xl p-10 text-center font-mono text-sm text-ink/60">
                  No add-ons yet.
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </PageShell>
  )
}