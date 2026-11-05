
import { PageShell } from "../components/PageShell"

const sections = [
  {
    title: "Bookings",
    note: "Review, approve or reject bookings",
  },
  {
    title: "Packages",
    note: "Add, edit and price packages",
  },
  {
    title: "Destinations",
    note: "Manage destinations",
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
          You're signed in as an admin. These tools are coming in the next steps.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {sections.map((s) => (
            <div
              key={s.title}
              className="bg-ink text-white rounded-2xl p-6 opacity-80"
            >
              <h2 className="text-lg font-black tracking-tight">
                {s.title}
              </h2>

              <p className="font-mono text-xs text-white/60 mt-2">
                {s.note}
              </p>

              <span className="inline-block mt-4 text-[10px] font-mono tracking-widest text-brand">
                COMING SOON
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
