export function formatCurrency(amount: number, currency: string = "CVE") {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency?.toUpperCase() || "CVE",
    currencyDisplay: "symbol",
  }).format(amount)
}

export function minorToMajorCurrencyAmount(amount: number | null | undefined) {
  return (amount ?? 0) / 100
}
