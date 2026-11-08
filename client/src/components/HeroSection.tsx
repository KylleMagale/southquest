import { useRef } from "react"
import { motion, useScroll, useSpring, useTransform, type Variants } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { brand, heroBenefits } from "../data/content"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] },
  }),
}

/** The hero photo lives at client/public/images/hero.webp. Replace that file to change the picture. */
const HERO_PHOTO = "/images/hero.webp"

export function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })

  // The photo drifts down slowly while the page scrolls.
  const photoY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 120]), {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const scrollToPackages = () => {
    document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-ink text-white"
    >
      <motion.div style={{ y: photoY }} className="absolute inset-x-0 -top-32 bottom-0">
        <img
          src={HERO_PHOTO}
          alt=""
          className="w-full h-full object-cover object-center"
          fetchPriority="high"
        />
      </motion.div>

      {/* Dark layers keep the white text readable on any photo. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/50 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-ink/50" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-32">
        <div className="max-w-2xl">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="font-mono text-xs md:text-sm tracking-[0.3em] text-white/80"
          >
            EXPLORE · CAMP · UNWIND
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="mt-5 text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-[0.95]"
          >
            {brand.first.toUpperCase()}
            {brand.second.toUpperCase()}
            <span className="block text-brand">OUTDOOR ESCAPES</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-6 text-lg md:text-xl text-white/90 max-w-md leading-snug"
          >
            Discover breathtaking destinations, experience nature up close, and create memories that last.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-wrap gap-3 mt-8"
          >
            <motion.button
              onClick={() => navigate("/packages")}
              className="bg-brand text-ink px-7 py-3.5 rounded-full font-bold text-sm tracking-wide flex items-center gap-2"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Explore Packages
              <span aria-hidden>→</span>
            </motion.button>

            <motion.button
              onClick={() => navigate("/builder")}
              className="border-2 border-white/70 text-white px-7 py-3.5 rounded-full font-bold text-sm tracking-wide hover:bg-white hover:text-ink transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Book Now
            </motion.button>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="flex flex-wrap gap-x-5 gap-y-2 mt-8"
          >
            {heroBenefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-xs font-mono text-white/80">
                <span className="w-1.5 h-1.5 bg-brand rounded-full" />
                {benefit}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>

      <motion.button
        onClick={scrollToPackages}
        aria-label="Scroll to packages"
        className="absolute right-6 bottom-24 hidden md:flex items-center gap-3 text-sm text-white/80 hover:text-white z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <span className="w-9 h-12 border-2 border-white/60 rounded-full flex justify-center pt-2">
          <motion.span
            className="w-1 h-2 bg-white/80 rounded-full"
            animate={{ y: [0, 10, 0], opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
        Scroll to explore
      </motion.button>

      {/* Wavy edge into the white section below. */}
      <svg
        className="absolute bottom-0 left-0 w-full h-16 md:h-24 z-10"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0,60 C240,0 480,100 720,60 C960,20 1200,90 1440,40 L1440,100 L0,100 Z" fill="#ffffff" />
      </svg>
    </section>
  )
}