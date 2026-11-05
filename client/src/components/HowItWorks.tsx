
import { useRef } from "react"
import { motion, useInView, type Variants } from "framer-motion"
import { steps } from "../data/content"

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
}

export function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="how" className="relative py-16 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-brand/5 to-white" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-12"
        >
          <span className="font-mono text-ink/60 text-xs tracking-widest inline-block">HOW IT WORKS</span>

          <h2 className="text-3xl md:text-5xl font-black text-ink tracking-tighter mt-2">
            <motion.span
              className="inline-block mr-[0.25em]"
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1], delay: 0.2 }}
            >
              BOOKED IN
            </motion.span>

            <motion.span
              className="text-brand inline-block"
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1], delay: 0.3 }}
            >
              5 STEPS
            </motion.span>
          </h2>
        </motion.div>

        <motion.ol
          ref={ref}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              variants={item}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 17 } }}
              className="relative bg-white border-2 border-ink/10 rounded-2xl p-5 shadow-sm"
            >
              <motion.div
                className="w-10 h-10 rounded-full bg-ink text-brand font-black flex items-center justify-center mb-4"
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                {i + 1}
              </motion.div>

              <h3 className="font-black text-ink tracking-tight leading-tight">{s.title}</h3>

              <p className="font-mono text-xs text-ink/60 mt-2 leading-relaxed">{s.description}</p>

              <motion.div
                className="h-0.5 bg-brand rounded-full mt-4 origin-left"
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
              />
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
