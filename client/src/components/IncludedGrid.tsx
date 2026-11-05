
import { useRef, useState, type MouseEvent } from "react"
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion"
import { Sparkles, Tent, Utensils, Wrench, type LucideIcon } from "lucide-react"
import { included } from "../data/content"

const icons: Record<string, LucideIcon> = {
  tent: Tent,
  utensils: Utensils,
  wrench: Wrench,
  sparkles: Sparkles,
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof included)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const Icon = icons[feature.icon]

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 300, damping: 30 })
  const sy = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(sy, [-0.5, 0.5], ["8deg", "-8deg"])
  const rotateY = useTransform(sx, [-0.5, 0.5], ["-8deg", "8deg"])

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
    setHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative group cursor-pointer"
    >
      <div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${feature.accent}40, transparent, ${feature.accent}40)`,
          filter: "blur(8px)",
        }}
      />

      <div className="relative bg-ink-soft rounded-2xl p-5 border border-white/10 overflow-hidden h-full">
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          initial={false}
          animate={
            hovered
              ? {
                  background: [
                    "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.03) 25%, transparent 30%)",
                    "linear-gradient(105deg, transparent 70%, rgba(255,255,255,0.03) 75%, transparent 80%)",
                  ],
                }
              : {}
          }
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10 flex flex-col h-full min-h-[150px]">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative"
            style={{ backgroundColor: `${feature.accent}20` }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: feature.accent }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                hovered
                  ? { opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }
                  : { opacity: 0, scale: 0.8 }
              }
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <Icon
              className="w-5 h-5 relative z-10"
              style={{ color: feature.accent }}
            />
          </motion.div>

          <div className="flex-1">
            <motion.div
              className="text-2xl sm:text-3xl font-black tracking-tight"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.2 + index * 0.1,
              }}
            >
              <span style={{ color: feature.accent }}>{feature.title}</span>
            </motion.div>

            <h3 className="text-sm font-semibold text-white mt-1">
              {feature.subtitle}
            </h3>
            <p className="text-xs text-white/50 mt-1 font-mono">
              {feature.description}
            </p>
          </div>

          <motion.div
            className="h-0.5 rounded-full mt-4 origin-left"
            style={{ backgroundColor: feature.accent }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              delay: 0.4 + index * 0.1,
              ease: [0.25, 0.4, 0.25, 1],
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export function IncludedGrid() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <section id="included" className="relative py-16 bg-ink overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-[#0a0a0a] to-ink" />

      <div ref={ref} className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.span
            className="inline-block font-mono text-brand text-[10px] tracking-[0.3em] uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.1 }}
          >
            What's Included
          </motion.span>

          <div className="overflow-hidden mt-2">
            <motion.h2
              className="text-3xl md:text-4xl font-black text-white tracking-tight"
              initial={{ y: 60 }}
              animate={inView ? { y: 0 } : { y: 60 }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.4, 0.25, 1],
                delay: 0.15,
              }}
            >
              Everything You Need, Sorted
            </motion.h2>
          </div>

          <motion.div
            className="h-0.5 w-12 bg-brand mx-auto mt-3 rounded-full origin-center"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.4,
              ease: [0.25, 0.4, 0.25, 1],
            }}
          />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {included.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
