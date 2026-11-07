import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import type { SceneKind } from "../data/content"
import type { ContentStatus } from "../lib/types"
import { Photo } from "./Photo"

export const inputClass =
  "w-full border-2 border-ink/10 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand"

const button =
  "px-4 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
export const btnPrimary = `${button} bg-brand text-ink hover:bg-brand-deep`
export const btnOutline = `${button} border-2 border-ink/20 text-ink hover:border-ink`

export const SCENES: { value: SceneKind; label: string }[] = [
  { value: "camp", label: "Tent / camp" },
  { value: "mountain", label: "Mountain" },
  { value: "beach", label: "Beach" },
  { value: "waterfall", label: "Waterfall" },
  { value: "forest", label: "Forest" },
]

export function AdminHeader({ title, accent, note }: { title: string; accent: string; note?: string }) {
  return (
    <>
      <Link to="/admin" className="font-mono text-xs text-ink/60 hover:text-ink">
        ← Dashboard
      </Link>
      <span className="block font-mono text-ink/60 text-xs tracking-widest mt-4">ADMIN</span>
      <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-2">
        {title}
        <span className="text-brand">{accent}</span>
      </h1>
      {note && <p className="font-mono text-sm text-ink/60 mt-3 max-w-2xl">{note}</p>}
    </>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold mb-1">{label}</span>
      {children}
      {hint && <span className="block font-mono text-[11px] text-ink/50 mt-1">{hint}</span>}
    </label>
  )
}

export function StatusPill({ status }: { status: ContentStatus }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
        status === "active" ? "bg-green-100 text-green-800" : "bg-ink/10 text-ink/60"
      }`}
    >
      {status === "active" ? "Visible" : "Hidden"}
    </span>
  )
}

export function StatusSelect({ value, onChange }: { value: ContentStatus; onChange: (v: ContentStatus) => void }) {
  return (
    <Field label="Status" hint="Hidden items disappear from the website. Existing bookings are kept.">
      <select value={value} onChange={(e) => onChange(e.target.value as ContentStatus)} className={inputClass}>
        <option value="active">Visible on the website</option>
        <option value="inactive">Hidden</option>
      </select>
    </Field>
  )
}

export function SceneSelect({ value, onChange }: { value: SceneKind; onChange: (v: SceneKind) => void }) {
  return (
    <Field label="Picture style" hint="The drawing shown when there is no photo.">
      <select value={value} onChange={(e) => onChange(e.target.value as SceneKind)} className={inputClass}>
        {SCENES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function PhotoField({
  value,
  onChange,
  scene,
  name,
}: {
  value: string
  onChange: (v: string) => void
  scene: SceneKind
  name: string
}) {
  const url = value.trim()

  return (
    <div>
      <Field
        label="Photo link"
        hint="Paste a link starting with https://, or a file in the website's public/images folder, like /images/my-photo.webp. Leave empty to use the built-in photo."
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </Field>

      {url && (
        <div className="mt-3 w-full max-w-xs aspect-[16/10] rounded-xl overflow-hidden bg-ink/5">
          {/* key: a new link starts a fresh load, so a fixed link replaces the fallback drawing */}
          <Photo key={url} photo={{ src: url }} alt={`Preview of ${name || "photo"}`} scene={scene} className="w-full h-full" />
        </div>
      )}
    </div>
  )
}

export function Notice({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="mt-8 flex items-start justify-between gap-4 bg-green-50 border-2 border-green-200 text-green-900 rounded-2xl px-4 py-3 text-sm"
    >
      <span>{children}</span>
      <button onClick={onDismiss} className="font-bold underline shrink-0">
        Dismiss
      </button>
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-2">
      {children}
    </p>
  )
}

/** "" -> null, otherwise a number (NaN if it isn't one, so the server can say so). */
export const numberOrNull = (v: string): number | null => (v.trim() === "" ? null : Number(v))