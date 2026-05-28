function normalizeCurrencyCode(currency: string | null | undefined): string {
  const code = String(currency || "CVE").trim().toUpperCase()
  if (code === "ECV") return "CVE"
  return /^[A-Z]{3}$/.test(code) ? code : "CVE"
}

export function formatCurrency(amount: number, currency: string = "CVE") {
  const safeCurrency = normalizeCurrencyCode(currency)

  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: safeCurrency,
    currencyDisplay: "symbol",
  }).format(amount)
}

export function minorToMajorCurrencyAmount(amount: number | null | undefined) {
  return (amount ?? 0) / 100
}
