export type WeeklyDealGlow =
  | "blue"
  | "purple"
  | "orange"
  | "green"
  | "slate"
  | "rose"
  | "cyan"
  | "amber"

export const WEEKLY_DEAL_GLOW_OPTIONS: Array<{
  value: WeeklyDealGlow
  label: string
}> = [
  { value: "blue", label: "Azul" },
  { value: "cyan", label: "Ciano" },
  { value: "purple", label: "Roxo" },
  { value: "rose", label: "Rosa" },
  { value: "orange", label: "Laranja" },
  { value: "amber", label: "Âmbar" },
  { value: "green", label: "Verde" },
  { value: "slate", label: "Cinza" },
]

export function isWeeklyDealHref(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v)
      return u.protocol === "http:" || u.protocol === "https:"
    } catch {
      return false
    }
  }
  return v.startsWith("/") && !v.startsWith("//")
}
