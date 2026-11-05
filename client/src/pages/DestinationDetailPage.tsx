
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Scene } from "../components/Scene"
import { ErrorState, LoadingState, NotFoundState, PageShell } from "../components/PageShell"
import { useApi } from "../lib/api"
import { categoryLabel, type Destination } from "../lib/types"

export default function DestinationDetailPage() {
  const { slug = "" } = useParams()
  const { data, status, retry } = useApi<Destination>(`/destinations/${encodeURIComponent(slug)}`)

  return (
    <PageShell title={data?.name ?? "Destination"}>
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState onRetry={retry} />}
      {status === "not-found" && (
        <NotFoundState what="Destination" backTo="/destinations" backLabel="See all destinations" />
      )}
      {status === "ok" && data && (
        <div className="max-w-6xl mx-auto px-6">
          <Link to="/destinations" className="font-mono text-xs text-ink/60 hover:text-ink">
            ← All destinations
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mt-6 rounded-3xl overflow-hidden aspect-[4/3] md:aspect-[16/9] bg-ink"
          >
            <Scene kind={data.scene} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent">
              <div className="flex items-center gap-1.5 text-brand font-mono text-xs tracking-widest uppercase">
                <MapPin className="w-3.5 h-3.5" />
                {categoryLabel[data.category]}
                {data.location && <span className="text-white/60 normal-case tracking-normal"> · {data.location}</span>}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mt-2">{data.name}</h1>
            </div>
          </motion.div>

          <p className="font-mono text-sm text-ink/60 mt-6 max-w-2xl leading-relaxed">{data.description}</p>

          <h2 className="text-2xl font-black tracking-tight mt-12 mb-5">Packages at {data.name}</h2>
          {data.packages.length === 0 ? (
            <p className="font-mono text-sm text-ink/60">Packages for this destination are coming soon.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.packages.map((p) => (
                <Link
                  key={p.slug}
                  to={`/packages/${p.slug}`}
                  className="group flex gap-4 items-center bg-white border-2 border-ink/10 rounded-2xl p-3 hover:border-brand hover:shadow-lg transition-all"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                    <Scene kind={p.scene} className="w-full h-full" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] tracking-widest uppercase text-brand-deep">{p.tagline}</span>
                    <h3 className="font-black tracking-tight leading-tight">{p.name}</h3>
                    <span className="text-xs font-bold group-hover:underline">View package →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
