/** Formata valor em CVE (assume API em centavos; divide por 100). Alinhado ao frontend. */
export function formatCurrency(amount: number, _currency: string = "CVE") {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "CVE",
    currencyDisplay: "symbol",
  }).format(amount / 100)
}
