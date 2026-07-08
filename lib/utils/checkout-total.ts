export type CheckoutLineInput = {
  unitAmount: number
  quantity: number
}

export type CheckoutPricingInput = {
  lines: CheckoutLineInput[]
  amountDiscount?: number | null
  amountShipping?: number | null
}

export type CheckoutPricing = {
  subtotalMinor: number
  discountMinor: number
  shippingMinor: number
  totalMinor: number
}

function roundMinorUpToWholeEscudos(minor: number): number {
  if (!Number.isFinite(minor) || minor <= 0) return 0
  return Math.ceil(minor / 100) * 100
}

export function computeCheckoutSubtotalMinor(lines: CheckoutLineInput[]): number {
  return lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0)
}

export function computeCheckoutPricing(input: CheckoutPricingInput): CheckoutPricing {
  const subtotalMinor = computeCheckoutSubtotalMinor(input.lines)
  const discountMinor = Math.min(Math.max(input.amountDiscount ?? 0, 0), subtotalMinor)
  const shippingMinor = Math.max(input.amountShipping ?? 0, 0)
  const totalMinor = roundMinorUpToWholeEscudos(
    Math.max(subtotalMinor - discountMinor + shippingMinor, 0),
  )

  return { subtotalMinor, discountMinor, shippingMinor, totalMinor }
}
