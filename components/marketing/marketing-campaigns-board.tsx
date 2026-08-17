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
const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "live", label: "Live" },
  { id: "scheduled", label: "Agendada" },
  { id: "draft", label: "Rascunho" },
  { id: "ended", label: "Encerrada" },
] as const

export function MarketingCampaignsBoard({
  campaigns,
  live,
}: {
  campaigns: MarketingCampaign[]
  live: MarketingCampaign | null
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>("all")

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const visible = useMemo(() => {
    let list = selectedDay
      ? campaigns.filter((c) => campaignCoversDay(c, selectedDay))
      : campaigns
    if (status !== "all") list = list.filter((c) => c.status === status)
    return [...list].sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    )
  }, [campaigns, selectedDay, status])

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-3">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={cn(
                "h-6 shrink-0 rounded-md px-2 text-[12px] font-medium",
                status === item.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {visible.length}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="px-4 py-10">
              <p className="text-[13px] font-medium">
                {selectedDay ? "Nada neste dia." : "Ainda não há campanhas."}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Cria uma com Nova, ou pede ao agente no separador Hoje.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((c) => {
                const isLive = live?.id === c.id
                return (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/marketing/campaigns/${c.id}`}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50"
                    >
                      {c.imageUrls[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.imageUrls[0]}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted">
                          <span className={cn("h-1.5 w-1.5 rounded-full", campaignDotClass(c.status))} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{c.name}</p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {c.headline || formatCampaignRange(c)}
                          <span className="text-border"> · </span>
                          {campaignObjectiveLabel(c.objective)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 text-[10px]", campaignStatusClass(c.status))}
                      >
                        {isLive ? "Na loja" : campaignStatusLabel(c.status)}
                      </Badge>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="hidden w-[18rem] shrink-0 overflow-y-auto border-l border-border p-3 lg:block">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-semibold capitalize">
            {format(month, "MMMM yyyy", { locale: pt })}
          </p>
          <div className="flex items-center gap-0.5">
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
        <div className="grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
          {WEEKDAYS.map((d, i) => (
            <div key={`${d}-${i}`} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px rounded-md border border-border bg-border">
          {days.map((day) => {
            const inMonth = isSameMonth(day, month)
            const hits = campaigns.filter((c) => campaignCoversDay(c, day))
            const selected =
              selectedDay && format(selectedDay, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(selected ? null : day)}
                className={cn(
                  "flex min-h-9 flex-col items-start gap-0.5 bg-background px-1 py-1 text-left hover:bg-muted/50",
                  !inMonth && "bg-muted/40 text-muted-foreground",
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
        {selectedDay ? (
          <button
            type="button"
            className="mt-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedDay(null)}
          >
            Ver todas
          </button>
        ) : null}
      </section>
    </div>
  )
}
