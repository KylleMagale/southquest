import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useLenis } from "lenis/react"
import { useLocation, useNavigate } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { brand, navLinks } from "../data/content"
import { useAuth } from "../lib/AuthContext"

const ease = [0.25, 0.4, 0.25, 1] as const

/** `overHero`: the bar sits on top of a dark photo, so it uses light text before you scroll. */
export function Navigation({ overHero = false }: { overHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const lenis = useLenis()
  const { user, role, signOut } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const navigate = useNavigate()
  const { pathname } = useLocation()

  const goTo = (to: string) => {
    const [path, hash] = to.split("#")
    setOpen(false)

    if (pathname !== (path || "/")) {
      navigate(to)
      return
    }

    const el = hash ? document.getElementById(hash) : null

    if (el) {
      if (lenis) lenis.scrollTo(el, { offset: -80 })
      else el.scrollIntoView({ behavior: "smooth" })
    } else if (lenis) {
      lenis.scrollTo(0)
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const onDark = scrolled || open || overHero
  const textMain = onDark ? "text-white" : "text-ink"
  const linkTone = onDark ? "text-white/80 hover:text-brand" : "text-ink/80 hover:text-ink"

  const handleLogout = async () => {
    setOpen(false)
    await signOut()
    navigate("/")
  }

  const authLinks = user ? (
    <>
      {role === "admin" && (
        <button onClick={() => goTo("/admin")} className={`text-sm font-medium transition-colors ${linkTone}`}>
          Admin
        </button>
      )}

      <button onClick={() => goTo("/account")} className={`text-sm font-medium transition-colors ${linkTone}`}>
        My Account
      </button>

      <button onClick={handleLogout} className={`text-sm font-medium transition-colors ${linkTone}`}>
        Log out
      </button>
    </>
  ) : (
    <button onClick={() => goTo("/login")} className={`text-sm font-medium transition-colors ${linkTone}`}>
      Log in
    </button>
  )

  const mobileItem = "block w-full text-left text-white/80 hover:text-brand text-lg font-medium py-2"

  const mobileAuth = (
    <div className="border-t border-white/10 pt-2 mt-2">
      {user ? (
        <>
          {role === "admin" && (
            <button onClick={() => goTo("/admin")} className={mobileItem}>
              Admin
            </button>
          )}

          <button onClick={() => goTo("/my-booking")} className={mobileItem}>
            My Booking
          </button>

          <button onClick={() => goTo("/account")} className={mobileItem}>
            My Account
          </button>

          <button onClick={handleLogout} className={mobileItem}>
            Log out
          </button>
        </>
      ) : (
        <button onClick={() => goTo("/login")} className={mobileItem}>
          Log in
        </button>
      )}
    </div>
  )

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || open ? "bg-ink/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button onClick={() => goTo("/")} className="flex items-center gap-3" aria-label={`${brand.first}${brand.second} home`}>
          <motion.img
            src="/images/logo.png"
            alt=""
            width={48}
            height={48}
            className="h-11 w-11 md:h-12 md:w-12 object-contain"
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          />

          <span className="text-left leading-none">
            <span className="block text-xl md:text-2xl font-black tracking-tighter">
              <span className={onDark ? "text-white" : "text-ink"}>{brand.first}</span>
              <span className="text-brand">{brand.second}</span>
            </span>
            <span
              className={`block mt-1 text-[8px] md:text-[9px] font-mono tracking-[0.28em] uppercase ${
                onDark ? "text-brand" : "text-ink/60"
              }`}
            >
              Outdoor Escapes
            </span>
          </span>
        </button>

        <div className="hidden xl:flex items-center gap-7">
          {navLinks.map((item, i) => (
            <motion.button
              key={item.label}
              onClick={() => goTo(item.to)}
              className={`text-sm font-medium tracking-wide transition-colors relative ${
                onDark ? "text-white/80 hover:text-brand" : "text-ink/80 hover:text-ink"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}

              <motion.span
                className="absolute -bottom-1 left-0 w-full h-0.5 bg-brand origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3, ease }}
              />
            </motion.button>
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-5">
          {authLinks}

          <motion.button
            onClick={() => goTo("/builder")}
            className="block bg-brand text-ink px-6 py-2.5 rounded-full font-bold text-sm tracking-wide relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(175,255,0,0.3)",
                  "0 0 40px rgba(175,255,0,0.6)",
                  "0 0 20px rgba(175,255,0,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />

            <span className="relative z-10">Book Now</span>
          </motion.button>
        </div>

        <motion.button
          className="xl:hidden p-2"
          onClick={() => setOpen(!open)}
          whileTap={{ scale: 0.9 }}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="text-white" /> : <Menu className={textMain} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="xl:hidden bg-ink/95 backdrop-blur-md border-t border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-2">
              {navLinks.map((item, i) => (
                <motion.button
                  key={item.label}
                  onClick={() => goTo(item.to)}
                  className="block w-full text-left text-white/80 hover:text-brand text-lg font-medium py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  {item.label}
                </motion.button>
              ))}

              {mobileAuth}

              <motion.button
                onClick={() => goTo("/builder")}
                className="w-full bg-brand text-ink px-6 py-3 rounded-full font-bold text-sm tracking-wide mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                Book Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}