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
  PhotoField,
  SceneSelect,
  StatusPill,
  StatusSelect,
} from "../components/AdminBits"
import type { SceneKind } from "../data/content"
import { apiFetch, ApiError, useApi } from "../lib/api"
import { categoryLabel, type AdminDestination, type ContentStatus } from "../lib/types"

interface FormState {
  name: string
  category: AdminDestination["category"]
  location: string
  description: string
  scene: SceneKind
  imageUrl: string
  status: ContentStatus
}

const blank: FormState = {
  name: "",
  category: "mountain",
  location: "",
  description: "",
  scene: "mountain",
  imageUrl: "",
  status: "active",
}

const fromDestination = (d: AdminDestination): FormState => ({
  name: d.name,
  category: d.category,
  location: d.location ?? "",
  description: d.description ?? "",
  scene: d.scene,
  imageUrl: d.imageUrl ?? "",
  status: d.status,
})

function DestinationForm({
  existing,
  onSaved,
  onCancel,
}: {
  existing: AdminDestination | null
  onSaved: (saved: AdminDestination) => void
  onCancel: () => void
}) {
  const [f, setF] = useState<FormState>(existing ? fromDestination(existing) : blank)
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

    if (existing && existing.status === "active" && f.status === "inactive") {
      if (!window.confirm(`Hide "${existing.name}" from the website? Existing bookings are kept.`)) return
    }

    setSaving(true)
    try {
      const saved = existing
        ? await apiFetch<AdminDestination>(`/admin/destinations/${existing.id}`, { method: "PATCH", body: f, auth: true })
        : await apiFetch<AdminDestination>("/admin/destinations", { method: "POST", body: f, auth: true })
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={top} onSubmit={submit} className="bg-white border-2 border-ink rounded-3xl p-6 mt-8 space-y-5 scroll-mt-28">
      <h2 className="text-2xl font-black tracking-tight">{existing ? `Edit ${existing.name}` : "New destination"}</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name">
          <input value={f.name} onChange={(e) => set("name", e.target.value)} className={inputClass} maxLength={80} required />
        </Field>
        <Field label="Category">
          <select value={f.category} onChange={(e) => set("category", e.target.value as FormState["category"])} className={inputClass}>
            {Object.entries(categoryLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Location" hint="For example: Cebu's 2nd District.">
        <input value={f.location} onChange={(e) => set("location", e.target.value)} className={inputClass} maxLength={120} />
      </Field>

      <Field label="Description">
        <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={1500} className={inputClass} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <SceneSelect value={f.scene} onChange={(v) => set("scene", v)} />
        <StatusSelect value={f.status} onChange={(v) => set("status", v)} />
      </div>

      <PhotoField value={f.imageUrl} onChange={(v) => set("imageUrl", v)} scene={f.scene} name={f.name} />

      {error && <FormError>{error}</FormError>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving..." : existing ? "Save changes" : "Create destination"}
        </button>
        <button type="button" onClick={onCancel} className={btnOutline}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function AdminDestinationsPage() {
  const destinations = useApi<AdminDestination[]>("/admin/destinations", { auth: true })
  const [editing, setEditing] = useState<AdminDestination | "new" | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <PageShell title="Admin: Destinations">
      <div className="max-w-5xl mx-auto px-6">
        <AdminHeader title="DESTI" accent="NATIONS" note="Add places, edit their details and photos, and hide ones that aren't open. Link a destination to packages from the Packages page." />

        {destinations.status === "error" && <ErrorState onRetry={destinations.retry} />}

        {notice && <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>}

        {destinations.data && (
          <>
            {editing ? (
              <DestinationForm
                key={editing === "new" ? "new" : editing.id}
                existing={editing === "new" ? null : editing}
                onCancel={() => setEditing(null)}
                onSaved={(saved) => {
                  setEditing(null)
                  setNotice(`Saved ${saved.name}. The website shows the change right away.`)
                  destinations.retry()
                }}
              />
            ) : (
              <button onClick={() => setEditing("new")} className={`${btnPrimary} mt-8`}>
                + Add a destination
              </button>
            )}

            <ul className="space-y-4 mt-8">
              {destinations.data.map((d) => (
                <li key={d.id} className="bg-white border-2 border-ink/10 rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight">{d.name}</h2>
                      <StatusPill status={d.status} />
                    </div>
                    <button onClick={() => setEditing(d)} className={btnOutline} aria-label={`Edit ${d.name}`}>
                      Edit
                    </button>
                  </div>
                  <p className="font-mono text-xs text-ink/60 mt-2">
                    {categoryLabel[d.category]}
                    {d.location ? ` · ${d.location}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </PageShell>
  )
}