export function formatCurrency(amount: number, _currency: string = "CVE") {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "CVE",
    currencyDisplay: "symbol",
  }).format(amount)
}
