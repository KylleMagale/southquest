import { useState } from "react"
import { Plus } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeading, PageShell } from "../components/PageShell"
import { faqs } from "../data/content"

export default function FaqsPage() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <PageShell title="FAQs">
      <PageHeading label="FAQS" first="GOT" accent="QUESTIONS?" intro="Quick answers about booking your trip." />

      <div className="max-w-3xl mx-auto px-6 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} className="border-2 border-ink/10 rounded-2xl bg-white overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
              >
                <span className="font-bold">{f.q}</span>
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    isOpen ? "rotate-45 bg-brand" : "bg-ink/10"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </span>
              </button>
              {isOpen && <p className="px-5 pb-5 font-mono text-sm text-ink/60 leading-relaxed">{f.a}</p>}
            </div>
          )
        })}

        <p className="font-mono text-sm text-ink/60 pt-6 text-center">
          Still not sure?{" "}
          <Link to="/contact" className="font-bold text-ink underline">
            Send us a message
          </Link>
        </p>
      </div>
    </PageShell>
  )
}