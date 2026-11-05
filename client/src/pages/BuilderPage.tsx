
import { useEffect, useMemo, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ErrorState, LoadingState, PageHeading, PageShell } from "../components/PageShell"
import { PriceBreakdown } from "../components/PriceBreakdown"
import { apiFetch, useApi } from "../lib/api"
import { loadDraft, saveDraft } from "../lib/draft"
import { formatDate, peso, tomorrowISO } from "../lib/format"
import { categoryLabel, type Addon, type Availability, type Package, type PriceQuote } from "../lib/types"

const DEFAULT_MAX_GUESTS = 20

function addonPrice(a: Addon): string {
  return `${peso(a.price)} ${a.priceType === "per_guest" ? "per guest" : "per booking"}`
}

export default function BuilderPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const packages = useApi<Package[]>("/packages")
  const addons = useApi<Addon[]>("/addons")

  // Start from the link (?package=...) or a saved draft.
  const draft = useMemo(() => loadDraft(), [])
  const [packageSlug, setPackageSlug] = useState(params.get("package") ?? draft?.packageSlug ?? "")
  const [destinationSlug, setDestinationSlug] = useState(params.get("destination") ?? draft?.destinationSlug ?? "")
  const [guests, setGuests] = useState(draft?.guests ?? 2)
  const [date, setDate] = useState(draft?.date ?? "")
  const [addonIds, setAddonIds] = useState<number[]>(draft?.addonIds ?? [])

  const [quote, setQuote] = useState<PriceQuote | null>(null)
  const [avail, setAvail] = useState<Availability | null>(null)
  const [checking, setChecking] = useState(false)

  const pkg = packages.data?.find((p) => p.slug === packageSlug) ?? null
  const destination = pkg?.destinations.find((d) => d.slug === destinationSlug) ?? null
  const maxGuests = pkg?.capacity ?? DEFAULT_MAX_GUESTS
  const addonKey = addonIds.join(",")

  // Keep selections consistent when the package changes.
  useEffect(() => {
    if (!pkg) return

    if (!pkg.destinations.some((d) => d.slug === destinationSlug)) {
      setDestinationSlug(pkg.destinations.length === 1 ? pkg.destinations[0].slug : "")
    }

    setGuests((g) => Math.min(Math.max(1, g), pkg.capacity ?? DEFAULT_MAX_GUESTS))
  }, [pkg, destinationSlug])

  // Live price calculated by the server.
  useEffect(() => {
    if (!packageSlug || !pkg) {
      setQuote(null)
      return
    }

    const ctrl = new AbortController()

    const t = setTimeout(() => {
      apiFetch<PriceQuote>("/price/calculate", {
        method: "POST",
        body: { packageSlug, guests, addonIds },
        signal: ctrl.signal,
      })
        .then(setQuote)
        .catch((e: Error) => e.name !== "AbortError" && setQuote(null))
    }, 250)

    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageSlug, pkg, guests, addonKey])

  
  // Check availability for the selected date.
  useEffect(() => {
    if (!pkg || !destination || !date) {
      setAvail(null)
      setChecking(false)
      return
    }

    const ctrl = new AbortController()
    setChecking(true)

    const t = setTimeout(() => {
      const params = new URLSearchParams({
        packageSlug,
        destinationSlug,
        date,
      })

      apiFetch<Availability>(
        `/availability?${params.toString()}`,
        {
          signal: ctrl.signal,
        }
      )
        .then((r) => {
          setAvail(r)
          setChecking(false)
        })
        .catch((e: Error) => {
          if (e.name === "AbortError") return

          setAvail({
            available: false,
            remaining: 0,
            reason: e.message,
          })
          setChecking(false)
        })
    }, 250)

    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [pkg, destination, packageSlug, destinationSlug, date, guests])

  const toggleAddon = (id: number) =>
    setAddonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const canReview =
    !!pkg &&
    !!destination &&
    !!date &&
    avail?.available === true &&
    quote?.priceAvailable === true

  const goReview = () => {
    if (!pkg || !destination || !canReview) return

    saveDraft({
      packageSlug: pkg.slug,
      packageName: pkg.name,
      destinationSlug: destination.slug,
      destinationName: destination.name,
      date,
      guests,
      addonIds,
    })

    navigate("/booking/review")
  }

  const loading = packages.status === "loading" || addons.status === "loading"
  const failed = packages.status === "error" || addons.status === "error"

  const meals = addons.data?.filter((a) => a.type === "meal") ?? []
  const extras = addons.data?.filter((a) => a.type === "extra") ?? []

  const card = "bg-white border-2 border-ink/10 rounded-3xl p-5 md:p-6"
  const heading = "font-black tracking-tight text-lg mb-4 flex items-center gap-3"
  const num = "w-7 h-7 rounded-full bg-ink text-brand text-sm flex items-center justify-center"

  return (
    <PageShell title="Plan your trip">
      <PageHeading
        label="PACKAGE BUILDER"
        first="PLAN YOUR"
        accent="TRIP"
        intro="Pick a package, set your date and see the price as you go."
      />

      {loading && <LoadingState />}
      {failed && <ErrorState onRetry={() => { packages.retry(); addons.retry() }} />}

      {!loading && !failed && packages.data && (
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-5">

            {/* 1. Package */}
            <section className={card}>
              <h2 className={heading}>
                <span className={num}>1</span> Choose a package
              </h2>

              <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Package">
                {packages.data.map((p) => {
                  const on = p.slug === packageSlug

                  return (
                    <button
                      key={p.slug}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setPackageSlug(p.slug)}
                      className={`text-left rounded-2xl border-2 p-4 transition-colors ${
                        on ? "border-brand bg-brand/10" : "border-ink/10 hover:border-ink/30"
                      }`}
                    >
                      <span className="font-mono text-[10px] tracking-widest uppercase text-brand-deep">
                        {p.tagline}
                      </span>

                      <span className="block font-black tracking-tight">{p.name}</span>

                      <span className="block font-mono text-xs text-ink/60 mt-1">
                        {p.basePrice === null
                          ? "Pricing coming soon"
                          : `${peso(p.basePrice)}${p.pricingType === "per_guest" ? " per guest" : ""}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* 2. Destination */}
            <section className={card}>
              <h2 className={heading}>
                <span className={num}>2</span> Choose a destination
              </h2>

              {!pkg ? (
                <p className="font-mono text-xs text-ink/50">Pick a package first.</p>
              ) : pkg.destinations.length === 0 ? (
                <p className="font-mono text-xs text-ink/60">
                  Destinations for this package are coming soon.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Destination">
                  {pkg.destinations.map((d) => {
                    const on = d.slug === destinationSlug

                    return (
                      <button
                        key={d.slug}
                        role="radio"
                        aria-checked={on}
                        onClick={() => setDestinationSlug(d.slug)}
                        className={`px-4 py-2 rounded-full border-2 font-mono text-sm transition-colors ${
                          on ? "border-brand bg-brand" : "border-ink/10 hover:border-ink/30"
                        }`}
                      >
                        {d.name} <span className="text-xs opacity-60">{categoryLabel[d.category]}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            {/* 3. Guests and date */}
            <section className={card}>
              <h2 className={heading}>
                <span className={num}>3</span> Guests and date
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <span className="block text-sm font-bold mb-2">Guests</span>

                  <div className="inline-flex items-center gap-4">
                    <button
                      aria-label="Fewer guests"
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      disabled={guests <= 1}
                      className="w-10 h-10 rounded-full border-2 border-ink flex items-center justify-center disabled:opacity-30"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="text-2xl font-black w-8 text-center" aria-live="polite">
                      {guests}
                    </span>

                    <button
                      aria-label="More guests"
                      onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
                      disabled={guests >= maxGuests}
                      className="w-10 h-10 rounded-full border-2 border-ink flex items-center justify-center disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {pkg?.capacity != null && (
                    <p className="font-mono text-xs text-ink/50 mt-2">
                      Up to {pkg.capacity} guests
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-bold mb-2">
                    Date
                  </label>

                  <input
                    id="date"
                    type="date"
                    min={tomorrowISO()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border-2 border-ink/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-brand"
                  />

                  <div className="min-h-6 mt-2 font-mono text-xs" aria-live="polite">
                    {checking && <span className="text-ink/50">Checking availability...</span>}
                    {!checking && avail?.available && (
                      <span className="text-green-700">
                        Available ({avail.remaining} left on this date)
                      </span>
                    )}
                    {!checking && avail && !avail.available && (
                      <span className="text-red-700">{avail.reason}</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Meals and extras */}
            {(meals.length > 0 || extras.length > 0) && (
              <section className={card}>
                <h2 className={heading}>
                  <span className={num}>4</span> Meals and extras
                </h2>

                {[[ "Meals", meals ], [ "Extras", extras ]].map(([title, list]) =>
                  (list as Addon[]).length === 0 ? null : (
                    <fieldset key={title as string} className="mb-4 last:mb-0">
                      <legend className="font-mono text-xs tracking-widest text-ink/60 mb-2 uppercase">
                        {title as string}
                      </legend>

                      <div className="grid sm:grid-cols-2 gap-2">
                        {(list as Addon[]).map((a) => (
                          <label
                            key={a.id}
                            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors ${
                              addonIds.includes(a.id)
                                ? "border-brand bg-brand/10"
                                : "border-ink/10 hover:border-ink/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={addonIds.includes(a.id)}
                              onChange={() => toggleAddon(a.id)}
                              className="accent-black w-4 h-4"
                            />
                            <span className="flex-1 text-sm font-bold">{a.name}</span>
                            <span className="font-mono text-xs text-ink/60">{addonPrice(a)}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ),
                )}
              </section>
            )}
          </div>

          {/* Booking summary */}
          <aside className="bg-white border-2 border-ink rounded-3xl p-6 lg:sticky lg:top-28 shadow-xl">
            <h2 className="font-black tracking-tight text-xl mb-4">Your trip</h2>

            <dl className="space-y-1 font-mono text-xs mb-5">
              <div className="flex justify-between gap-3">
                <dt className="text-ink/50">Package</dt>
                <dd className="font-bold text-right">{pkg?.name ?? "-"}</dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-ink/50">Destination</dt>
                <dd className="font-bold text-right">{destination?.name ?? "-"}</dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-ink/50">Date</dt>
                <dd className="font-bold text-right">{date ? formatDate(date) : "-"}</dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt className="text-ink/50">Guests</dt>
                <dd className="font-bold text-right">{guests}</dd>
              </div>
            </dl>

            <PriceBreakdown quote={quote} />

            <button
              onClick={goReview}
              disabled={!canReview}
              className="w-full mt-6 bg-brand text-ink px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review booking
            </button>

            {!canReview && (
              <p className="font-mono text-[11px] text-ink/50 mt-3 text-center">
                {!pkg
                  ? "Choose a package to continue."
                  : !destination
                    ? "Choose a destination."
                    : !date
                      ? "Pick a date."
                      : checking
                        ? "Checking availability..."
                        : avail && !avail.available
                          ? "Choose an available date."
                          : quote && !quote.priceAvailable
                            ? "This package can't be booked online yet."
                            : ""}
              </p>
            )}
          </aside>
        </div>
      )}
    </PageShell>
  )
}
