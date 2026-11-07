export interface Addon {
  id: number
  name: string
  type: "meal" | "extra"
  price: number
  priceType: "per_guest" | "per_booking"
}

export interface PriceLine {
  label: string
  quantity: number
  unitPrice: number
  total: number
}

export interface PriceResult {
  lines: PriceLine[]
  total: number
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * Total = package price + add-ons.
 *  - package: per_guest -> basePrice x guests, flat -> basePrice
 *  - add-on:  per_guest -> price x guests,     per_booking -> price
 * This is the only place prices are calculated; the browser never sends a price.
 */
export function calculatePrice(input: {
  pricingType: "per_guest" | "flat"
  basePrice: number
  guests: number
  addons: Addon[]
}): PriceResult {
  const { pricingType, basePrice, guests, addons } = input

  const line = (label: string, quantity: number, unitPrice: number): PriceLine => ({
    label,
    quantity,
    unitPrice,
    total: round2(quantity * unitPrice),
  })

  const lines: PriceLine[] = [line("Package", pricingType === "per_guest" ? guests : 1, basePrice)]
  for (const a of addons) lines.push(line(a.name, a.priceType === "per_guest" ? guests : 1, a.price))

  return { lines, total: round2(lines.reduce((sum, l) => sum + l.total, 0)) }
}