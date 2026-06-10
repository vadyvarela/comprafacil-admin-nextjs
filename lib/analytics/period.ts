import {
  startOfDay,
  endOfDay,
  subDays,
  differenceInCalendarDays,
  format,
} from "date-fns"
import { ptBR } from "date-fns/locale"

export interface AnalyticsPeriod {
  from: Date
  to: Date
  startDate: string
  endDate: string
  dayCount: number
}

export function resolveAnalyticsPeriod(
  from: Date | null,
  to: Date | null
): AnalyticsPeriod {
  const toDate = to ? endOfDay(to) : endOfDay(new Date())
  const fromDate = from ? startOfDay(from) : startOfDay(subDays(toDate, 29))
  const dayCount = differenceInCalendarDays(toDate, fromDate) + 1

  return {
    from: fromDate,
    to: toDate,
    startDate: fromDate.toISOString(),
    endDate: toDate.toISOString(),
    dayCount,
  }
}

export function previousPeriod(period: AnalyticsPeriod): AnalyticsPeriod {
  const dayCount = period.dayCount
  const prevTo = endOfDay(subDays(period.from, 1))
  const prevFrom = startOfDay(subDays(prevTo, dayCount - 1))

  return {
    from: prevFrom,
    to: prevTo,
    startDate: prevFrom.toISOString(),
    endDate: prevTo.toISOString(),
    dayCount,
  }
}

export function periodLabel(period: AnalyticsPeriod): string {
  return `${format(period.from, "dd MMM", { locale: ptBR })} – ${format(period.to, "dd MMM yyyy", { locale: ptBR })}`
}

export function isWeekPresetPeriod(period: AnalyticsPeriod): boolean {
  return period.dayCount <= 7
}

export function calcDelta(
  current: number,
  previous: number
): { delta: string; trend: "up" | "down" | "neutral" } {
  if (previous === 0) {
    if (current === 0) return { delta: "0%", trend: "neutral" }
    return { delta: "+100%", trend: "up" }
  }
  const change = ((current - previous) / previous) * 100
  const rounded = Math.round(change * 10) / 10
  return {
    delta: `${rounded >= 0 ? "+" : ""}${rounded}%`,
    trend: rounded > 0 ? "up" : rounded < 0 ? "down" : "neutral",
  }
}
