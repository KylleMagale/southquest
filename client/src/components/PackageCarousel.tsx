
import { useState, type MouseEvent } from "react"
import { AnimatePresence, motion, useSpring, type Variants } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { packages } from "../data/content"

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
    rotateY: direction > 0 ? 15 : -15,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.9,
    rotateY: direction > 0 ? -15 : 15,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  }),
}

export function PackageCarousel() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const current = packages[index]

  const rotateX = useSpring(0, { stiffness: 150, damping: 20 })
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 })

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    rotateY.set(((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 5)
    rotateX.set((-(e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 5)
  }

  const onLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const go = (to: number) => {
    const next = (to + packages.length) % packages.length
    setDirection(to > index || (index === packages.length - 1 && next === 0) ? 1 : -1)
    setIndex(next)
  }

  return (
    <section id="packages" className="relative py-16 bg-white overflow-hidden">
      <motion.div
        key={current.id}
        className={`absolute inset-0 bg-gradient-to-br ${current.bgColor}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-10"
        >
          <span className="font-mono text-ink/60 text-xs tracking-widest">OUR PACKAGES</span>
          <h2 className="text-3xl md:text-5xl font-black text-ink tracking-tighter mt-2">
            <motion.span
              className="inline-block mr-[0.25em]"
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            >
              PICK YOUR
            </motion.span>
            <motion.span
              className="inline-block mr-[0.25em]"
              style={{ color: current.accentColor }}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1], delay: 0.1 }}
            >
              ESCAPE
            </motion.span>
          </h2>
        </motion.div>

        <div className="relative">
          <div className="flex items-center justify-center gap-6">
            <motion.button
              onClick={() => go(index - 1)}
              aria-label="Previous package"
              className="hidden md:flex shrink-0 w-12 h-12 rounded-full border-2 border-ink items-center justify-center hover:bg-ink hover:text-white transition-colors"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="relative w-full max-w-3xl"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  className="bg-white rounded-3xl p-6 md:p-8 border-2 border-ink/10 shadow-xl"
                  style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                  onMouseMove={onMove}
                  onMouseLeave={onLeave}
                >
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <motion.div
                      className="relative aspect-[4/5] rounded-2xl overflow-hidden"
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <img
                        src={current.image}
                        alt={`${current.name} package`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </motion.div>

                    <div className="space-y-4">
                      <div>
                        <motion.span
                          className="font-mono text-xs tracking-widest uppercase"
                          style={{ color: current.accentColor }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {current.tagline}
                        </motion.span>

                        <motion.h3
                          className="text-3xl md:text-4xl font-black text-ink tracking-tighter mt-1"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                        >
                          {current.name}
                        </motion.h3>
                      </div>

                      <motion.p
                        className="text-sm text-ink/60 font-mono leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {current.description}
                      </motion.p>

                      <motion.div
                        className="flex flex-wrap gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {current.badges.map((b) => (
                          <span key={b} className="px-2 py-1 bg-ink/5 rounded-full text-xs font-mono text-ink/60">
                            {b}
                          </span>
                        ))}
                      </motion.div>

                      <motion.button
                        onClick={() => navigate(`/builder?package=${current.slug}`)}
                        className="px-6 py-3 rounded-full font-bold text-sm tracking-wide w-full md:w-auto relative overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        style={{ backgroundColor: current.accentColor, color: "#121212" }}
                      >
                        <motion.span
                          className="absolute inset-0 bg-white/20"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.5 }}
                        />
                        <span className="relative z-10">Customize &amp; Book</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <motion.button
              onClick={() => go(index + 1)}
              aria-label="Next package"
              className="hidden md:flex shrink-0 w-12 h-12 rounded-full border-2 border-ink items-center justify-center hover:bg-ink hover:text-white transition-colors"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex md:hidden justify-center gap-4 mt-6">
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous package"
              className="w-10 h-10 rounded-full border-2 border-ink flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next package"
              className="w-10 h-10 rounded-full border-2 border-ink flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {packages.map((p, i) => (
              <motion.button
                key={p.id}
                onClick={() => {
                  setDirection(i > index ? 1 : -1)
                  setIndex(i)
                }}
                aria-label={`Show ${p.name}`}
                className="h-2 rounded-full"
                style={{ backgroundColor: i === index ? p.accentColor : "#12121220" }}
                animate={{ width: i === index ? 28 : 10 }}
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
