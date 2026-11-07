
import { useEffect } from "react"
import AccountPage from "./pages/AccountPage"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { useLenis } from "lenis/react"
import { ClickSpark } from "./components/ClickSpark"
import { LenisProvider } from "./components/LenisProvider"
import { Navigation } from "./components/Navigation"
import { HeroSection } from "./components/HeroSection"
import { PackageCarousel } from "./components/PackageCarousel"
import { IncludedGrid } from "./components/IncludedGrid"
import { DestinationsSection } from "./components/DestinationsSection"
import { AudienceSection } from "./components/AudienceSection"
import { HowItWorks } from "./components/HowItWorks"
import { FaqSection } from "./components/FaqSection"
import { Footer } from "./components/Footer"
import { AuthProvider } from "./lib/AuthContext"
import { RequireAuth } from "./components/RequireAuth"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import MyBookingPage from "./pages/MyBookingPage"
import AdminPage from "./pages/AdminPage"
import BuilderPage from "./pages/BuilderPage"
import BookingReviewPage from "./pages/BookingReviewPage"
import BookingConfirmationPage from "./pages/BookingConfirmationPage"
import PackagesPage from "./pages/PackagesPage"
import PackageDetailPage from "./pages/PackageDetailPage"
import DestinationsPage from "./pages/DestinationsPage"
import DestinationDetailPage from "./pages/DestinationDetailPage"
import AdminBookingsPage from "./pages/AdminBookingsPage"
import AdminPackagesPage from "./pages/AdminPackagesPage"
import AdminDestinationsPage from "./pages/AdminDestinationsPage"
import AdminAddonsPage from "./pages/AdminAddonsPage"
import AdminAvailabilityPage from "./pages/AdminAvailabilityPage"

function Landing() {
  const { hash } = useLocation()
  const lenis = useLenis()

  useEffect(() => {
    document.title = "SouthQuest Outdoor Escapes | Camping & Glamping in Cebu"

    if (!hash) {
      window.scrollTo(0, 0)
      return
    }

    const t = setTimeout(() => {
      const el = document.getElementById(hash.slice(1))
      if (!el) return

      if (lenis) {
        lenis.resize()
        lenis.scrollTo(el, { offset: -80 })
      } else {
        el.scrollIntoView({ behavior: "smooth" })
      }
    }, 300)

    return () => clearTimeout(t)
  }, [hash, lenis])

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <PackageCarousel />
      <IncludedGrid />
      <DestinationsSection />
      <AudienceSection />
      <HowItWorks />
      <FaqSection />
      <Footer />
    </main>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
      <h1 className="text-4xl font-black tracking-tighter">Page not found</h1>
      <a
        href="/"
        className="bg-brand text-ink px-6 py-3 rounded-full font-bold text-sm"
      >
        Back to home
      </a>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ClickSpark />
      <AuthProvider>
        <LenisProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/packages/:slug" element={<PackageDetailPage />} />
            <Route path="/destinations" element={<DestinationsPage />} />
            <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/my-booking"
              element={
                <RequireAuth>
                  <MyBookingPage />
                </RequireAuth>
              }
            />

            <Route
              path="/account"
              element={
                <RequireAuth>
                  <AccountPage />
                </RequireAuth>
              }
            />

            <Route
              path="/admin"
              element={
                <RequireAuth admin>
                  <AdminPage />
                </RequireAuth>
              }
            />

            <Route
              path="/admin/bookings"
              element={
                <RequireAuth admin>
                  <AdminBookingsPage />
                </RequireAuth>
              }
            />

            <Route path="/admin/packages" element={<RequireAuth admin><AdminPackagesPage /></RequireAuth>} />
            <Route path="/admin/destinations" element={<RequireAuth admin><AdminDestinationsPage /></RequireAuth>} />
            <Route path="/admin/addons" element={<RequireAuth admin><AdminAddonsPage /></RequireAuth>} />
            <Route path="/admin/availability" element={<RequireAuth admin><AdminAvailabilityPage /></RequireAuth>} />

            <Route path="/builder" element={<BuilderPage />} />

            <Route
              path="/booking/review"
              element={
                <RequireAuth>
                  <BookingReviewPage />
                </RequireAuth>
              }
            />

            <Route
              path="/booking/confirmation/:reference"
              element={
                <RequireAuth>
                  <BookingConfirmationPage />
                </RequireAuth>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </LenisProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
