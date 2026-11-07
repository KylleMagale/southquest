import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import { AuthCard, Field, FormError, PasswordField, SubmitButton } from "../components/AuthForm"
import { AuthNotConfigured } from "../components/RequireAuth"
import { PageShell } from "../components/PageShell"
import { useAuth } from "../lib/AuthContext"

export default function LoginPage() {
  const { configured, user, role, loading, signIn } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!configured) return <AuthNotConfigured />

  // Already signed in: return to the page they originally wanted.
  if (user && !loading) {
    return <Navigate to={from ?? (role === "admin" ? "/admin" : "/my-booking")} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError("Enter your email and password.")
      return
    }

    setBusy(true)
    const res = await signIn(email, password)
    setBusy(false)

    // On success, the redirect above takes over once the profile loads.
    if (res.error) setError(res.error)
  }

  return (
    <PageShell title="Log in">
      <AuthCard title="WELCOME" accent="BACK" subtitle="Log in to see your bookings.">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <FormError message={error} />
          <SubmitButton busy={busy}>Log in</SubmitButton>
        </form>

        <p className="text-center font-mono text-xs text-ink/60 mt-6">
          New to SouthQuest?{" "}
          <Link to="/register" state={{ from }} className="font-bold text-ink underline">
            Create an account
          </Link>
        </p>
      </AuthCard>
    </PageShell>
  )
}