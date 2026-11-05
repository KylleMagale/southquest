
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
  total: number
  lines: PriceLine[]
}

interface CalculatePriceInput {
  pricingType: "per_guest" | "flat"
  basePrice: number
  guests: number
  addons: Addon[]
}

export function calculatePrice(input: CalculatePriceInput): PriceResult {
  const { pricingType, basePrice, guests, addons } = input

  const lines: PriceLine[] = []
  const packageQuantity = pricingType === "per_guest" ? guests : 1

  lines.push({
    label: "Package",
    quantity: packageQuantity,
    unitPrice: basePrice,
    total: packageQuantity * basePrice,
  })

  for (const addon of addons) {
    const quantity = addon.priceType === "per_guest" ? guests : 1

    lines.push({
      label: addon.name,
      quantity,
      unitPrice: addon.price,
      total: quantity * addon.price,
    })
  }

  const total = Math.round(
    (lines.reduce((sum, line) => sum + line.total, 0) + Number.EPSILON) * 100,
  ) / 100

  return {
    total,
    lines: lines.map((line) => ({
      ...line,
      total: Math.round((line.total + Number.EPSILON) * 100) / 100,
    })),
  }
}
