
import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import { AuthCard, Field, FormError, SubmitButton } from "../components/AuthForm"
import { AuthNotConfigured } from "../components/RequireAuth"
import { PageShell } from "../components/PageShell"
import { useAuth } from "../lib/AuthContext"

export default function RegisterPage() {
  const { configured, user, loading, signUp } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  })

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  if (!configured) return <AuthNotConfigured />
  if (user && !loading) return <Navigate to={from ?? "/my-booking"} replace />

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.fullName.trim()) {
      return setError("Please enter your full name.")
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return setError("Please enter a valid email address.")
    }

    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters.")
    }

    if (form.password !== form.confirm) {
      return setError("The two passwords don't match.")
    }

    setBusy(true)

    const res = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      phone: form.phone,
    })

    setBusy(false)

    if (res.error) setError(res.error)
    else if (res.needsConfirmation) setCheckEmail(true)

    // Otherwise, a session exists and the Navigate above takes over.
  }

  if (checkEmail) {
    return (
      <PageShell title="Check your email">
        <AuthCard
          title="CHECK YOUR"
          accent="EMAIL"
          subtitle={`We sent a confirmation link to ${form.email.trim()}.`}
        >
          <p className="font-mono text-sm text-ink/70 leading-relaxed">
            Click the link in that email to activate your account, then log in.
          </p>

          <Link
            to="/login"
            state={{ from }}
            className="block text-center mt-6 bg-brand text-ink px-6 py-3.5 rounded-full font-bold text-sm"
          >
            Go to log in
          </Link>
        </AuthCard>
      </PageShell>
    )
  }

  return (
    <PageShell title="Create account">
      <AuthCard
        title="CREATE YOUR"
        accent="ACCOUNT"
        subtitle="One account for all your SouthQuest bookings."
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field
            id="fullName"
            label="Full name"
            autoComplete="name"
            value={form.fullName}
            onChange={set("fullName")}
          />

          <Field
            id="phone"
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            hint="So we can reach you about your booking."
          />

          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
          />

          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            hint="At least 8 characters."
          />

          <Field
            id="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set("confirm")}
          />

          <FormError message={error} />
          <SubmitButton busy={busy}>Create account</SubmitButton>
        </form>

        <p className="text-center font-mono text-xs text-ink/60 mt-6">
          Already have an account?{" "}
          <Link to="/login" state={{ from }} className="font-bold text-ink underline">
            Log in
          </Link>
        </p>
      </AuthCard>
    </PageShell>
  )
}
