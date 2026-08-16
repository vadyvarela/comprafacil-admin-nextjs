"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MarketingCampaign } from "@/lib/graphql/marketing/types"
import {
  campaignCoversDay,
  campaignDotClass,
  campaignObjectiveLabel,
  campaignStatusClass,
  campaignStatusLabel,
  formatCampaignRange,
} from "@/lib/marketing/campaigns"

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"]

const STATUS_ORDER = ["live", "scheduled", "draft", "ended"]

export function MarketingCampaignsBoard({
  campaigns,
  live,
}: {
  campaigns: MarketingCampaign[]
  live: MarketingCampaign | null
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const visible = useMemo(() => {
    const list = selectedDay
      ? campaigns.filter((c) => campaignCoversDay(c, selectedDay))
      : campaigns
    return [...list].sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    )
  }, [campaigns, selectedDay])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
      {live ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                Live esta semana
              </p>
              <h2 className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">{live.name}</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {live.headline || live.hook || formatCampaignRange(live)}
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="h-7 text-[11px]">
              <Link href={`/dashboard/marketing/campaigns/${live.id}`}>Abrir</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-border/80 bg-card px-4 py-3">
          <p className="text-[12px] text-muted-foreground">
            Nenhuma campanha live. Cria uma com datas desta semana — loja, Facebook e Instagram ficam no mesmo sítio.
          </p>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-lg border border-border/80 bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold capitalize tracking-tight">
              {format(month, "MMMM yyyy", { locale: pt })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={() => {
                  setMonth(startOfMonth(new Date()))
                  setSelectedDay(null)
                }}
              >
                Hoje
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Mês seguinte"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {WEEKDAYS.map((d, i) => (
              <div key={`${d}-${i}`} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px rounded-md bg-border/60">
            {days.map((day) => {
              const inMonth = isSameMonth(day, month)
              const hits = campaigns.filter((c) => campaignCoversDay(c, day))
              const selected = selectedDay && format(selectedDay, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(selected ? null : day)}
                  className={cn(
                    "flex min-h-[52px] flex-col items-start gap-1 bg-card px-1.5 py-1 text-left hover:bg-muted/50",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                    selected && "ring-1 ring-inset ring-foreground/30",
                    isToday(day) && "font-semibold",
                  )}
                >
                  <span className="text-[11px] tabular-nums">{format(day, "d")}</span>
                  <span className="flex flex-wrap gap-0.5">
                    {hits.slice(0, 3).map((c) => (
                      <span
                        key={c.id}
                        className={cn("h-1.5 w-1.5 rounded-full", campaignDotClass(c.status))}
                        title={c.name}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border border-border/80 bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {selectedDay ? format(selectedDay, "d MMMM", { locale: pt }) : "Todas"}
            </p>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {visible.length}
            </span>
          </div>
          {visible.length === 0 ? (
            <p className="px-3 py-6 text-[12px] text-muted-foreground">
              {selectedDay ? "Nada neste dia." : "Ainda não há campanhas."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/marketing/campaigns/${c.id}`}
                    className="flex items-start justify-between gap-3 px-3 py-2.5 hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-foreground">{c.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatCampaignRange(c)} · {campaignObjectiveLabel(c.objective)}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px]", campaignStatusClass(c.status))}>
                      {campaignStatusLabel(c.status)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
