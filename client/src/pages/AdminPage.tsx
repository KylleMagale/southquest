import { Link } from "react-router-dom"
import { PageShell } from "../components/PageShell"

const sections = [
  {
    title: "Bookings",
    note: "Review, confirm or reject bookings",
    to: "/admin/bookings",
  },
  {
    title: "Packages",
    note: "Add, edit and price packages",
    to: null,
  },
  {
    title: "Destinations",
    note: "Manage destinations",
    to: null,
  },
]

export default function AdminPage() {
  return (
    <PageShell title="Admin">
      <div className="max-w-5xl mx-auto px-6">
        <span className="font-mono text-ink/60 text-xs tracking-widest">
          ADMIN
        </span>

        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-2">
          DASH<span className="text-brand">BOARD</span>
        </h1>

        <p className="font-mono text-sm text-ink/60 mt-3">
          You're signed in as an admin.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {sections.map((s) =>
            s.to ? (
              <Link
                key={s.title}
                to={s.to}
                className="group bg-ink text-white rounded-2xl p-6 ring-4 ring-brand/40 hover:ring-brand transition-all"
              >
                <h2 className="text-lg font-black tracking-tight">{s.title}</h2>
                <p className="font-mono text-xs text-white/60 mt-2">{s.note}</p>
                <span className="inline-block mt-4 text-xs font-mono font-bold tracking-widest text-brand group-hover:translate-x-1 transition-transform">
                  OPEN →
                </span>
              </Link>
            ) : (
              <div
                key={s.title}
                className="bg-ink text-white rounded-2xl p-6 opacity-60"
              >
                <h2 className="text-lg font-black tracking-tight">{s.title}</h2>
                <p className="font-mono text-xs text-white/60 mt-2">{s.note}</p>
                <span className="inline-block mt-4 text-[10px] font-mono tracking-widest text-brand">
                  COMING SOON
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </PageShell>
  )
}