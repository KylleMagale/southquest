
import { useRef } from "react"
import { motion, useInView, type Variants } from "framer-motion"
import { MapPin } from "lucide-react"
import { Link } from "react-router-dom"
import { destinations } from "../data/content"
import { destinationPhoto } from "../lib/photos"
import { Photo } from "./Photo"

const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
}

export function DestinationsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <section
      id="destinations"
      className="relative py-16 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.4, 0.25, 1],
          }}
          className="text-center mb-10"
        >
          <span className="font-mono text-ink/60 text-xs tracking-widest inline-block">
            DESTINATIONS
          </span>

          <h2 className="text-3xl md:text-5xl font-black text-ink tracking-tighter mt-2">
            <motion.span
              className="inline-block mr-[0.25em]"
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.4, 0.25, 1],
                delay: 0.2,
              }}
            >
              WHERE TO
            </motion.span>

            <motion.span
              className="text-brand inline-block"
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.4, 0.25, 1],
                delay: 0.3,
              }}
            >
              NEXT?
            </motion.span>
          </h2>
        </motion.div>

        <motion.div
          ref={ref}
          className="grid md:grid-cols-3 gap-4"
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {destinations.map((destination) => (
            <motion.div
              key={destination.name}
              variants={item}
              whileHover={{
                scale: 1.03,
                zIndex: 10,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                },
              }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer bg-ink"
            >
              <Link
                to={`/destinations/${destination.slug}`}
                aria-label={destination.name}
                className="absolute inset-0 z-20"
              />

              <Photo
                photo={destinationPhoto(destination.slug)}
                alt={`${destination.name} campsite`}
                scene={destination.scene}
                className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
              />

              <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/20 transition-colors duration-300" />

              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent">
                <div className="flex items-center gap-1.5 text-brand font-mono text-[10px] tracking-widest uppercase">
                  <MapPin className="w-3 h-3" />
                  {destination.category}
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight mt-1">
                  {destination.name}
                </h3>

                <p className="text-white/70 font-mono text-xs mt-1">
                  {destination.note}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
