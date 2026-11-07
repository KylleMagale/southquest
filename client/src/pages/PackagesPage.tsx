
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ErrorState, LoadingState, PageHeading, PageShell } from "../components/PageShell"
import { Photo } from "../components/Photo"
import { useApi } from "../lib/api"
import { packagePhoto } from "../lib/photos"
import { priceLabel, type Package } from "../lib/types"

export default function PackagesPage() {
  const { data, status, retry } = useApi<Package[]>("/packages")

  return (
    <PageShell title="Packages">
      <PageHeading
        label="OUR PACKAGES"
        first="FIND YOUR"
        accent="ESCAPE"
        intro="Four all-inclusive ways to camp. Pick the one that fits your trip."
      />

      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState onRetry={retry} />}

      {status === "ok" && data && (
        <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 100, damping: 20 }}
              whileHover={{ y: -6 }}
            >
              <Link
                to={`/packages/${p.slug}`}
                className="group flex flex-col h-full bg-white border-2 border-ink/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-brand transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  
                  <Photo
                    photo={packagePhoto(p.slug, p.imageUrl)}
                    alt={`${p.name} package`}
                    scene={p.scene}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />

                </div>

                <div className="p-5 flex flex-col flex-1">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-brand-deep">
                    {p.tagline}
                  </span>

                  <h2 className="text-xl font-black tracking-tight mt-1">{p.name}</h2>

                  <p className="font-mono text-xs text-ink/60 mt-2 leading-relaxed flex-1">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {p.inclusions.slice(0, 3).map((inc) => (
                      <span key={inc} className="px-2 py-1 bg-ink/5 rounded-full text-[10px] font-mono text-ink/60">
                        {inc}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-ink/10 flex items-center justify-between text-sm">
                    <span className="font-bold">{priceLabel(p)}</span>
                    <span className="font-bold text-ink group-hover:translate-x-1 transition-transform">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
