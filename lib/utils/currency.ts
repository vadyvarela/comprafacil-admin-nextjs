export function formatCurrency(amount: number, currency: string = "CVE") {
  return new Intl.NumberFormat("pt-CV", {
    style: "currency",
    currency: "CVE",
  }).format(amount / 100)
}
