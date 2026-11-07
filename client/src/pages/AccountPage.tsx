import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { FormError, Field, PasswordField, SubmitButton } from "../components/AuthForm"
import { PageShell } from "../components/PageShell"
import { useAuth } from "../lib/AuthContext"
import { ArrowRight, CalendarCheck } from "lucide-react"

function Notice({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="bg-brand/20 border border-brand text-ink rounded-xl px-4 py-3 text-sm font-mono"
    >
      {message}
    </div>
  )
}

const PHONE_OK = /^[+()\d][\d\s()+-]{5,19}$/

export default function AccountPage() {
  const { user, profile, updateProfile, changePassword } = useAuth()

  // Profile form
  const [fullName, setFullName] = useState(profile?.fullName ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileNote, setProfileNote] = useState<string | null>(null)
  const [profileBusy, setProfileBusy] = useState(false)

  // Password form
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" })
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwNote, setPwNote] = useState<string | null>(null)
  const [pwBusy, setPwBusy] = useState(false)

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileNote(null)

    if (!fullName.trim()) return setProfileError("Please enter your full name.")
    if (phone.trim() && !PHONE_OK.test(phone.trim())) {
      return setProfileError("Please enter a valid phone number, or leave it empty.")
    }

    setProfileBusy(true)
    const res = await updateProfile({ fullName, phone })
    setProfileBusy(false)

    if (res.error) setProfileError(res.error)
    else setProfileNote("Your details have been saved.")
  }

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwNote(null)

    if (!pw.current) return setPwError("Enter your current password.")
    if (pw.next.length < 8) return setPwError("New password must be at least 8 characters.")
    if (pw.next !== pw.confirm) return setPwError("The two new passwords don't match.")

    setPwBusy(true)
    const res = await changePassword(pw.current, pw.next)
    setPwBusy(false)

    if (res.error) {
      setPwError(res.error)
    } else {
      setPw({ current: "", next: "", confirm: "" })
      setPwNote("Your password has been changed.")
    }
  }

  const card = "bg-white border-2 border-ink/10 rounded-3xl p-6 md:p-8 shadow-xl"

  return (
    <PageShell title="My Account">
      <div className="max-w-2xl mx-auto px-6">
        <span className="font-mono text-ink/60 text-xs tracking-widest">MY ACCOUNT</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-2">
          YOUR <span className="text-brand">DETAILS</span>
        </h1>
        <p className="font-mono text-sm text-ink/60 mt-3">
          Keep your contact details up to date so we can reach you about your bookings.
        </p>

        <Link
          to="/my-booking"
          className="group mt-6 flex items-center justify-between gap-4 bg-ink text-brand rounded-2xl px-6 py-5 md:py-6 shadow-xl ring-4 ring-brand/40 hover:ring-brand hover:scale-[1.02] active:scale-[0.99] transition-all focus:outline-none focus-visible:ring-brand"
        >
          <span className="flex items-center gap-4">
            <CalendarCheck size={28} aria-hidden="true" />
            <span className="text-lg md:text-xl font-black tracking-tight">
              Show My Bookings
            </span>
          </span>
          <ArrowRight
            size={24}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>

        <section className={`${card} mt-8`} aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-xl font-black tracking-tight mb-5">
            Profile
          </h2>

          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            <Field
              id="fullName"
              label="Full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Field
              id="phone"
              label="Phone (optional)"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              hint="So we can reach you about your booking."
            />

            <Field
              id="email"
              label="Email"
              type="email"
              value={user?.email ?? ""}
              readOnly
              disabled
              hint="Your email is your log-in and can't be changed here."
            />

            <FormError message={profileError} />
            <Notice message={profileNote} />
            <SubmitButton busy={profileBusy}>Save changes</SubmitButton>
          </form>
        </section>

        <section className={`${card} mt-6`} aria-labelledby="password-heading">
          <h2 id="password-heading" className="text-xl font-black tracking-tight mb-5">
            Change password
          </h2>

          <form onSubmit={savePassword} className="space-y-4" noValidate>
            <PasswordField
              id="currentPassword"
              label="Current password"
              autoComplete="current-password"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
            />

            <PasswordField
              id="newPassword"
              label="New password"
              autoComplete="new-password"
              value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              hint="At least 8 characters."
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            />

            <FormError message={pwError} />
            <Notice message={pwNote} />
            <SubmitButton busy={pwBusy}>Change password</SubmitButton>
          </form>
        </section>
      </div>
    </PageShell>
  )
}