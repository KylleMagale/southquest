
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import { Link } from "react-router-dom"
import { Scene } from "../components/Scene"
import {
  ErrorState,
  LoadingState,
  PageHeading,
  PageShell,
} from "../components/PageShell"
import { useApi } from "../lib/api"
import { categoryLabel, type Destination } from "../lib/types"

export default function DestinationsPage() {
  const { data, status, retry } = useApi<Destination[]>("/destinations")

  return (
    <PageShell title="Destinations">
      <PageHeading
        label="DESTINATIONS"
        first="WHERE TO"
        accent="NEXT?"
        intro="Highland, coastal or waterfall: choose the setting for your trip."
      />

      {status === "loading" && <LoadingState />}

      {status === "error" && <ErrorState onRetry={retry} />}

      {status === "ok" && data && (
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-5">
          {data.map((d, i) => (
            <motion.div
              key={d.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 20,
              }}
            >
              <Link
                to={`/destinations/${d.slug}`}
                className="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-ink"
              >
                <Scene
                  kind={d.scene}
                  className="absolute inset-0 w-full h-full grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />

                <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/20 transition-colors duration-300" />

                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent">
                  <div className="flex items-center gap-1.5 text-brand font-mono text-[10px] tracking-widest uppercase">
                    <MapPin className="w-3 h-3" />
                    {categoryLabel[d.category]}
                  </div>

                  <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                    {d.name}
                  </h2>

                  <p className="text-white/70 font-mono text-xs mt-1">
                    {d.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
