export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "")
}

export function whatsappHref(number: string | null | undefined, text: string): string | null {
  const digits = digitsOnly(number)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function formatWhatsappDisplay(number: string | null | undefined): string {
  const digits = digitsOnly(number)
  if (!digits) return "—"
  if (digits.startsWith("238") && digits.length === 10) {
    return `+238 ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return `+${digits}`
}
