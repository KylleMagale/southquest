
import type { ReactNode } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../lib/AuthContext"
import { LoadingState, PageShell } from "./PageShell"

export function RequireAuth({
  children,
  admin = false,
}: {
  children: ReactNode
  admin?: boolean
}) {
  const { configured, loading, user, role } = useAuth()
  const location = useLocation()

  if (!configured) {
    return <AuthNotConfigured />
  }

  if (loading) {
    return (
      <PageShell title="Loading">
        <LoadingState />
      </PageShell>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (admin && role !== "admin") {
    return (
      <PageShell title="Not allowed">
        <div className="max-w-xl mx-auto px-6 text-center py-16">
          <h1 className="text-3xl font-black tracking-tighter">
            This area is for admins.
          </h1>

          <p className="font-mono text-sm text-ink/60 mt-2">
            Your account doesn't have admin access.
          </p>

          <Link
            to="/"
            className="inline-block mt-6 bg-brand text-ink px-6 py-3 rounded-full font-bold text-sm"
          >
            Back to home
          </Link>
        </div>
      </PageShell>
    )
  }

  return <>{children}</>
}

export function AuthNotConfigured() {
  return (
    <PageShell title="Sign in">
      <div className="max-w-xl mx-auto px-6 text-center py-16">
        <h1 className="text-3xl font-black tracking-tighter">
          Sign-in isn't set up yet.
        </h1>

        <p className="font-mono text-sm text-ink/60 mt-3 leading-relaxed">
          Add{" "}
          <code className="bg-ink/5 px-1.5 py-0.5 rounded">
            VITE_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="bg-ink/5 px-1.5 py-0.5 rounded">
            VITE_SUPABASE_ANON_KEY
          </code>{" "}
          to{" "}
          <code className="bg-ink/5 px-1.5 py-0.5 rounded">
            client/.env
          </code>
          , then restart the development server.
        </p>
      </div>
    </PageShell>
  )
}
