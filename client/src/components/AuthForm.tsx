
import type {
  InputHTMLAttributes,
  ReactNode,
} from "react"

export function AuthCard({
  title,
  accent,
  subtitle,
  children,
}: {
  title: string
  accent: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="max-w-md mx-auto px-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
          {title} <span className="text-brand">{accent}</span>
        </h1>

        <p className="font-mono text-sm text-ink/60 mt-3">
          {subtitle}
        </p>
      </div>

      <div className="bg-white border-2 border-ink/10 rounded-3xl p-6 md:p-8 shadow-xl">
        {children}
      </div>
    </div>
  )
}

interface FieldProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function Field({
  label,
  hint,
  id,
  ...props
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-bold mb-1.5"
      >
        {label}
      </label>

      <input
        id={id}
        {...props}
        className="w-full border-2 border-ink/10 rounded-xl px-4 py-3 font-mono text-sm bg-white focus:outline-none focus:border-brand transition-colors"
      />

      {hint && (
        <p className="font-mono text-xs text-ink/50 mt-1">
          {hint}
        </p>
      )}
    </div>
  )
}

export function FormError({
  message,
}: {
  message: string | null
}) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-mono"
    >
      {message}
    </div>
  )
}

export function SubmitButton({
  busy,
  children,
}: {
  busy: boolean
  children: ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full bg-brand text-ink px-6 py-3.5 rounded-full font-bold text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-transform"
    >
      {busy ? "Please wait..." : children}
    </button>
  )
}
