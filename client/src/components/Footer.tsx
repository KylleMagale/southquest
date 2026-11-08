
import { useRef, useState } from "react"
import { motion, useInView, type Variants } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { brand, footerLinks } from "../data/content"

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
}

export function Footer() {
  const [hovering, setHovering] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })
  const navigate = useNavigate()

  return (
    <footer ref={ref} id="contact" className="relative bg-ink pt-16 pb-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]">
            <motion.span
              className="block"
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            >
              READY TO
            </motion.span>

            <motion.span
              className="block text-brand"
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1], delay: 0.1 }}
            >
              CAMP OUT?
            </motion.span>
          </h2>
        </motion.div>

        <motion.div
          className="flex justify-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.button
            onClick={() => navigate("/builder")}
            className="bg-brand text-ink px-8 py-3.5 rounded-full font-bold text-sm tracking-wide relative overflow-hidden"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            <span className="relative z-10">Book Your Escape</span>
          </motion.button>
        </motion.div>

        <p className="text-center text-white/60 font-mono text-xs max-w-xl mx-auto leading-relaxed mb-10">
          {brand.first}
          {brand.second} Outdoor Escapes offers all-inclusive camping and glamping packages in {brand.region}. Pick a
          destination, customize your stay and book online.
        </p>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-6 py-8 border-t border-white/10"
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {footerLinks.map((section) => (
            <motion.div key={section.title} variants={item}>
              <h4 className="font-bold text-white text-sm mb-3">{section.title}</h4>

              <ul className="space-y-2">
                {section.links.map((l) => (
                  <li key={l.label}>
                    <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                      <Link
                        to={l.to}
                        className="text-white/60 hover:text-brand font-mono text-xs transition-colors inline-block"
                      >
                        {l.label}
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-white/10 gap-3">
          <motion.span
            className="flex items-center gap-2 text-xl font-black"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <img src="/images/logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span>
              <span className="text-white">{brand.first}</span>
              <span className="text-brand">{brand.second}</span>
            </span>
          </motion.span>

          <p className="text-white/40 font-mono text-xs">
            © 2026 SouthQuest Outdoor Escapes. All rights reserved.
          </p>

          <motion.p
            className="text-white/30 font-mono text-xs cursor-pointer"
            onHoverStart={() => setHovering(true)}
            onHoverEnd={() => setHovering(false)}
            animate={
              hovering
                ? { rotate: [0, -5, 5, -5, 5, 0], scale: [1, 1.1, 1], color: "#AFFF00" }
                : { rotate: 0, scale: 1, color: "rgba(255,255,255,0.3)" }
            }
            transition={{ duration: 0.5 }}
          >
            see you outdoors
          </motion.p>
        </div>
      </div>

      <motion.div
        aria-hidden
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[15rem] md:text-[30rem] font-black text-white/[0.02] pointer-events-none select-none leading-none"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        SQ
      </motion.div>
    </footer>
  )
}
