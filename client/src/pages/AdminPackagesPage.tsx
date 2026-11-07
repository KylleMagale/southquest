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
  PhotoField,
  SceneSelect,
  StatusPill,
  StatusSelect,
} from "../components/AdminBits"
import type { SceneKind } from "../data/content"
import { apiFetch, ApiError, useApi } from "../lib/api"
import { peso } from "../lib/format"
import type { AdminDestination, AdminPackage, ContentStatus } from "../lib/types"

interface FormState {
  name: string
  tagline: string
  description: string
  pricingType: "per_guest" | "flat"
  basePrice: string
  capacity: string
  inclusions: string
  destinationIds: number[]
  scene: SceneKind
  imageUrl: string
  status: ContentStatus
}

const blank: FormState = {
  name: "",
  tagline: "",
  description: "",
  pricingType: "per_guest",
  basePrice: "",
  capacity: "",
  inclusions: "",
  destinationIds: [],
  scene: "camp",
  imageUrl: "",
  status: "active",
}

const fromPackage = (p: AdminPackage): FormState => ({
  name: p.name,
  tagline: p.tagline ?? "",
  description: p.description ?? "",
  pricingType: p.pricingType,
  basePrice: p.basePrice === null ? "" : String(p.basePrice),
  capacity: p.capacity === null ? "" : String(p.capacity),
  inclusions: p.inclusions.join("\n"),
  destinationIds: p.destinationIds,
  scene: p.scene,
  imageUrl: p.imageUrl ?? "",
  status: p.status,
})

function PackageForm({
  existing,
  destinations,
  onSaved,
  onCancel,
}: {
  existing: AdminPackage | null
  destinations: AdminDestination[]
  onSaved: (saved: AdminPackage) => void
  onCancel: () => void
}) {
  const [f, setF] = useState<FormState>(existing ? fromPackage(existing) : blank)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const top = useRef<HTMLFormElement>(null)

  useEffect(() => {
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setF((s) => ({ ...s, [key]: value }))

  const toggleDestination = (id: number) =>
    set("destinationIds", f.destinationIds.includes(id) ? f.destinationIds.filter((x) => x !== id) : [...f.destinationIds, id])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (existing && existing.status === "active" && f.status === "inactive") {
      if (!window.confirm(`Hide "${existing.name}" from the website? Existing bookings are kept.`)) return
    }

    setSaving(true)
    try {
      const body = {
        name: f.name,
        tagline: f.tagline,
        description: f.description,
        pricingType: f.pricingType,
        basePrice: numberOrNull(f.basePrice),
        capacity: numberOrNull(f.capacity),
        inclusions: f.inclusions.split("\n"),
        destinationIds: f.destinationIds,
        scene: f.scene,
        imageUrl: f.imageUrl,
        status: f.status,
      }
      const saved = existing
        ? await apiFetch<AdminPackage>(`/admin/packages/${existing.id}`, { method: "PATCH", body, auth: true })
        : await apiFetch<AdminPackage>("/admin/packages", { method: "POST", body, auth: true })
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={top} onSubmit={submit} className="bg-white border-2 border-ink rounded-3xl p-6 mt-8 space-y-5 scroll-mt-28">
      <h2 className="text-2xl font-black tracking-tight">{existing ? `Edit ${existing.name}` : "New package"}</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name">
          <input value={f.name} onChange={(e) => set("name", e.target.value)} className={inputClass} maxLength={80} required />
        </Field>
        <Field label="Tagline" hint="A few words under the name, like Highland Adventure.">
          <input value={f.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputClass} maxLength={80} />
        </Field>
      </div>

      <Field label="Description">
        <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={1500} className={inputClass} />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Pricing type">
          <select value={f.pricingType} onChange={(e) => set("pricingType", e.target.value as FormState["pricingType"])} className={inputClass}>
            <option value="per_guest">Per guest</option>
            <option value="flat">Flat price per booking</option>
          </select>
        </Field>
        <Field label="Price (₱)" hint="Leave empty to show Pricing coming soon.">
          <input type="number" min={0} step="0.01" value={f.basePrice} onChange={(e) => set("basePrice", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Max guests" hint="Empty means no limit.">
          <input type="number" min={1} step={1} value={f.capacity} onChange={(e) => set("capacity", e.target.value)} className={inputClass} />
        </Field>
      </div>
      {existing && (
        <p className="font-mono text-xs text-ink/60 -mt-2">
          A new price only applies to new bookings. Bookings already made keep the price they were made at.
        </p>
      )}

      <Field label="What's included" hint="One item per line.">
        <textarea value={f.inclusions} onChange={(e) => set("inclusions", e.target.value)} rows={4} className={inputClass} />
      </Field>

      <fieldset>
        <legend className="text-xs font-bold mb-2">Offered at these destinations</legend>
        <div className="flex flex-wrap gap-2">
          {destinations.map((d) => {
            const on = f.destinationIds.includes(d.id)
            return (
              <label
                key={d.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 cursor-pointer text-sm font-bold ${
                  on ? "border-ink bg-ink text-white" : "border-ink/15 text-ink"
                }`}
              >
                <input type="checkbox" checked={on} onChange={() => toggleDestination(d.id)} className="accent-[#AFFF00]" />
                {d.name}
                {d.status === "inactive" && <span className="font-normal opacity-60">(hidden)</span>}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <SceneSelect value={f.scene} onChange={(v) => set("scene", v)} />
        <StatusSelect value={f.status} onChange={(v) => set("status", v)} />
      </div>

      <PhotoField value={f.imageUrl} onChange={(v) => set("imageUrl", v)} scene={f.scene} name={f.name} />

      {error && <FormError>{error}</FormError>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving..." : existing ? "Save changes" : "Create package"}
        </button>
        <button type="button" onClick={onCancel} className={btnOutline}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function AdminPackagesPage() {
  const packages = useApi<AdminPackage[]>("/admin/packages", { auth: true })
  const destinations = useApi<AdminDestination[]>("/admin/destinations", { auth: true })
  const [editing, setEditing] = useState<AdminPackage | "new" | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const failed = packages.status === "error" || destinations.status === "error"
  const ready = packages.data && destinations.data

  return (
    <PageShell title="Admin: Packages">
      <div className="max-w-5xl mx-auto px-6">
        <AdminHeader title="PACK" accent="AGES" note="Add packages, set prices and capacity, choose where each one is offered, and hide ones you don't want shown." />

        {failed && <ErrorState onRetry={() => { packages.retry(); destinations.retry() }} />}

        {notice && <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>}

        {ready && !failed && (
          <>
            {editing ? (
              <PackageForm
                key={editing === "new" ? "new" : editing.id}
                existing={editing === "new" ? null : editing}
                destinations={destinations.data!}
                onCancel={() => setEditing(null)}
                onSaved={(saved) => {
                  setEditing(null)
                  setNotice(`Saved ${saved.name}. The website shows the change right away.`)
                  packages.retry()
                }}
              />
            ) : (
              <button onClick={() => setEditing("new")} className={`${btnPrimary} mt-8`}>
                + Add a package
              </button>
            )}

            <ul className="space-y-4 mt-8">
              {packages.data!.map((p) => {
                const names = destinations.data!.filter((d) => p.destinationIds.includes(d.id)).map((d) => d.name)
                return (
                  <li key={p.id} className="bg-white border-2 border-ink/10 rounded-2xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight">{p.name}</h2>
                        <StatusPill status={p.status} />
                      </div>
                      <button onClick={() => setEditing(p)} className={btnOutline} aria-label={`Edit ${p.name}`}>
                        Edit
                      </button>
                    </div>
                    <p className="font-mono text-xs text-ink/60 mt-2">
                      {p.basePrice === null ? "No price yet" : `${peso(p.basePrice)}${p.pricingType === "per_guest" ? " per guest" : " flat"}`}
                      {" · "}
                      {p.capacity === null ? "No guest limit" : `Up to ${p.capacity} guests`}
                      {" · "}
                      {names.length ? names.join(", ") : "No destinations yet"}
                    </p>
                  </li>
                )
              })}
              {packages.data!.length === 0 && (
                <li className="border-2 border-dashed border-ink/15 rounded-3xl p-10 text-center font-mono text-sm text-ink/60">
                  No packages yet.
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </PageShell>
  )
}