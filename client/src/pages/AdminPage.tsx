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
    note: "Prices, capacity, photos and where each is offered",
    to: "/admin/packages",
  },
  {
    title: "Destinations",
    note: "Places, descriptions and photos",
    to: "/admin/destinations",
  },
  {
    title: "Add-ons",
    note: "Meals and extras, with their prices",
    to: "/admin/addons",
  },
  {
    title: "Availability",
    note: "Daily booking limits and closed dates",
    to: "/admin/availability",
  },
  {
    title: "Inquiries",
    note: "Messages from the Contact page",
    to: "/admin/inquiries",
  },
  {
    title: "Reviews",
    note: "Approve or hide customer reviews",
    to: "/admin/reviews",
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {sections.map((s) => (
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
          ))}
        </div>
      </div>
    </PageShell>
  )
}