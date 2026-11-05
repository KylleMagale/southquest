
import { useEffect, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Navigation } from "./Navigation"
import { Footer } from "./Footer"

export function PageShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    document.title = `${title} | SouthQuest Outdoor Escapes`
    window.scrollTo(0, 0)
  }, [title])

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="pt-28 pb-20 min-h-[70vh]">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export function LoadingState() {
  return (
    <div
      className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4"
      aria-busy="true"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="aspect-[4/5] rounded-2xl bg-ink/5 animate-pulse"
        />
      ))}
    </div>
  )
}

export function ErrorState({
  onRetry,
}: {
  onRetry: () => void
}) {
  return (
    <div className="max-w-xl mx-auto px-6 text-center py-16">
      <h2 className="text-2xl font-black tracking-tight">
        We couldn't load this right now.
      </h2>

      <p className="font-mono text-sm text-ink/60 mt-2">
        Check your connection and try again.
      </p>

      <button
        onClick={onRetry}
        className="mt-6 bg-brand text-ink px-6 py-3 rounded-full font-bold text-sm"
      >
        Try again
      </button>
    </div>
  )
}

export function NotFoundState({
  what,
  backTo,
  backLabel,
}: {
  what: string
  backTo: string
  backLabel: string
}) {
  return (
    <div className="max-w-xl mx-auto px-6 text-center py-16">
      <h2 className="text-2xl font-black tracking-tight">
        {what} not found.
      </h2>

      <p className="font-mono text-sm text-ink/60 mt-2">
        It may have been removed or the link is wrong.
      </p>

      <Link
        to={backTo}
        className="inline-block mt-6 bg-brand text-ink px-6 py-3 rounded-full font-bold text-sm"
      >
        {backLabel}
      </Link>
    </div>
  )
}

export function PageHeading({
  label,
  first,
  accent,
  intro,
}: {
  label: string
  first: string
  accent: string
  intro?: string
}) {
  return (
    <div className="text-center mb-10 px-6">
      <span className="font-mono text-ink/60 text-xs tracking-widest">
        {label}
      </span>

      <h1 className="text-4xl md:text-6xl font-black text-ink tracking-tighter mt-2">
        {first} <span className="text-brand">{accent}</span>
      </h1>

      {intro && (
        <p className="font-mono text-sm text-ink/60 mt-3 max-w-xl mx-auto">
          {intro}
        </p>
      )}
    </div>
  )
}
