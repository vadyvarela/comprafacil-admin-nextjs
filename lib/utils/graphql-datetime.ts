import { format, parseISO, startOfDay, endOfDay } from "date-fns"

/** Formato DateTime aceite pelo payment-gateway GraphQL (sem timezone). */
export function toGraphQLDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss")
}

export function toGraphQLDateTimeBoundary(
  value: string | null | undefined,
  boundary: "start" | "end"
): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.includes("T")) {
    // Evita re-enviar ISO com timezone/millis — o gateway rejeita.
    if (/[Zz]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
      const parsed = new Date(trimmed)
      if (Number.isNaN(parsed.getTime())) return null
      return toGraphQLDateTime(boundary === "start" ? startOfDay(parsed) : endOfDay(parsed))
    }
    return trimmed
  }
  const parsed = parseISO(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return toGraphQLDateTime(boundary === "start" ? startOfDay(parsed) : endOfDay(parsed))
}
