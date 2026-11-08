import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Field, FormError, btnPrimary, inputClass } from "../components/AdminBits"
import { PageHeading, PageShell } from "../components/PageShell"
import { ApiError, apiFetch } from "../lib/api"

const empty = { name: "", email: "", phone: "", message: "", website: "" }

export default function ContactPage() {
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const set = (key: keyof typeof empty) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await apiFetch("/inquiries", { method: "POST", body: form })
      setSent(true)
      setForm(empty)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell title="Contact us">
      <PageHeading label="CONTACT" first="GET IN" accent="TOUCH" intro="Questions about a package or a date? Send us a message." />

      <div className="max-w-xl mx-auto px-6">
        {sent ? (
          <div className="bg-ink text-white rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-black tracking-tight text-brand">Message sent</h2>
            <p className="font-mono text-sm text-white/70 mt-2">Thanks! We'll get back to you by email.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setSent(false)} className="border-2 border-white/30 px-5 py-2.5 rounded-full font-bold text-sm">
                Send another
              </button>
              <Link to="/packages" className="bg-brand text-ink px-5 py-2.5 rounded-full font-bold text-sm">
                See packages
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white border-2 border-ink/10 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
            <Field label="Your name">
              <input required maxLength={100} value={form.name} onChange={set("name")} className={inputClass} autoComplete="name" />
            </Field>
            <Field label="Email">
              <input required type="email" maxLength={200} value={form.email} onChange={set("email")} className={inputClass} autoComplete="email" />
            </Field>
            <Field label="Phone (optional)">
              <input type="tel" maxLength={40} value={form.phone} onChange={set("phone")} className={inputClass} autoComplete="tel" />
            </Field>
            <Field label="Message" hint="At least 10 characters.">
              <textarea required rows={5} maxLength={2000} value={form.message} onChange={set("message")} className={inputClass} />
            </Field>

            {/* Hidden from people. Bots tend to fill it in, and the server then ignores the message. */}
            <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label>
                Leave this empty
                <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
              </label>
            </div>

            {error && <FormError>{error}</FormError>}

            <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
              {busy ? "Sending..." : "Send message"}
            </button>
          </form>
        )}
      </div>
    </PageShell>
  )
}