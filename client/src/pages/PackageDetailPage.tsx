
import { motion } from "framer-motion"
import { Check, MapPin, Users } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Photo } from "../components/Photo"
import { ErrorState, LoadingState, NotFoundState, PageShell } from "../components/PageShell"
import { useApi } from "../lib/api"
import { packagePhoto } from "../lib/photos"
import { categoryLabel, priceLabel, type Package } from "../lib/types"

export default function PackageDetailPage() {
  const { slug = "" } = useParams()
  const { data, status, retry } = useApi<Package>(`/packages/${encodeURIComponent(slug)}`)

  return (
    <PageShell title={data?.name ?? "Package"}>
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState onRetry={retry} />}
      {status === "not-found" && <NotFoundState what="Package" backTo="/packages" backLabel="See all packages" />}
      {status === "ok" && data && (
        <div className="max-w-6xl mx-auto px-6">
          <Link to="/packages" className="font-mono text-xs text-ink/60 hover:text-ink">
            ← All packages
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 mt-6 items-start">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl overflow-hidden border-2 border-ink/10 shadow-xl aspect-[4/3] lg:sticky lg:top-28"
            >
              <Photo
                photo={packagePhoto(data.slug, data.imageUrl)}
                alt={`${data.name} package`}
                scene={data.scene}
                className="w-full h-full"
                eager
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <span className="font-mono text-xs tracking-widest uppercase text-brand-deep">{data.tagline}</span>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-1">{data.name}</h1>
                <p className="font-mono text-sm text-ink/60 mt-4 leading-relaxed">{data.description}</p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-4 py-2 rounded-full bg-ink text-white font-bold">{priceLabel(data)}</span>
                {data.capacity !== null && (
                  <span className="px-4 py-2 rounded-full bg-ink/5 font-mono flex items-center gap-2">
                    <Users className="w-4 h-4" /> Up to {data.capacity} guests
                  </span>
                )}
              </div>

              <div>
                <h2 className="font-black tracking-tight text-lg mb-3">What's included</h2>
                <ul className="space-y-2">
                  {data.inclusions.map((inc) => (
                    <li key={inc} className="flex items-center gap-3 font-mono text-sm">
                      <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-ink" />
                      </span>
                      {inc}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-black tracking-tight text-lg mb-3">Available at</h2>
                {data.destinations.length === 0 ? (
                  <p className="font-mono text-sm text-ink/60">Destinations to be announced.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.destinations.map((d) => (
                      <Link
                        key={d.slug}
                        to={`/destinations/${d.slug}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-ink/10 hover:border-brand font-mono text-sm transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        {d.name}
                        <span className="text-ink/40 text-xs">{categoryLabel[d.category]}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to={`/builder?package=${data.slug}`}
                className="inline-block w-full sm:w-auto text-center px-8 py-3.5 rounded-full font-bold text-sm bg-brand text-ink hover:scale-[1.02] transition-transform"
              >
                Customize &amp; Book
              </Link>
            </motion.div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
