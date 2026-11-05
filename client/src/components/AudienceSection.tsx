
import { useRef } from "react"
import { motion, useInView, type Variants } from "framer-motion"
import {
  GraduationCap,
  Heart,
  Leaf,
  Users,
  type LucideIcon,
} from "lucide-react"
import { audiences } from "../data/content"

const icons: Record<string, LucideIcon> = {
  heart: Heart,
  users: Users,
  graduation: GraduationCap,
  leaf: Leaf,
}

const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
}

export function AudienceSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="who" className="relative py-16 bg-ink overflow-hidden">
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
          <span className="font-mono text-brand text-xs tracking-widest inline-block">
            MADE FOR
          </span>

          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mt-2">
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
              EVERY KIND OF
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
              CAMPER
            </motion.span>
          </h2>

          <motion.p
            className="text-sm text-white/60 font-mono mt-2 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            Solo, together or with the whole group: there's a package that fits.
          </motion.p>
        </motion.div>

        <motion.div
          ref={ref}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {audiences.map((audience) => {
            const Icon = icons[audience.icon]

            return (
              <motion.div
                key={audience.title}
                variants={item}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 17,
                  },
                }}
                className="group bg-ink-soft border border-white/10 rounded-2xl p-6 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <motion.div
                    className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center mb-4 group-hover:bg-ink transition-colors duration-300"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 17,
                    }}
                  >
                    <Icon className="w-5 h-5 text-ink group-hover:text-brand transition-colors duration-300" />
                  </motion.div>

                  <h3 className="text-lg font-black text-white group-hover:text-ink tracking-tight mb-2 transition-colors duration-300">
                    {audience.title}
                  </h3>

                  <p className="text-white/60 group-hover:text-ink/70 font-mono text-xs leading-relaxed mb-4 transition-colors duration-300">
                    {audience.description}
                  </p>

                  <span className="flex items-center gap-2 text-brand group-hover:text-ink font-bold text-xs tracking-wide transition-colors duration-300">
                    {audience.cta}
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
