"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { CalendarDays, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AnalyticsDateFilterProps {
  from?: string
  to?: string
}

const PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
]

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function AnalyticsDateFilter({ from, to }: AnalyticsDateFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [fromVal, setFromVal] = useState(from ?? "")
  const [toVal, setToVal] = useState(to ?? "")

  const apply = (f: string, t: string) => {
    const params = new URLSearchParams()
    if (f) params.set("from", f)
    if (t) params.set("to", t)
    router.push(`${pathname}?${params.toString()}`)
  }

  const applyPreset = (days: number) => {
    const t = new Date()
    const f = new Date()
    f.setDate(f.getDate() - days + 1)
    const fStr = toDateInput(f)
    const tStr = toDateInput(t)
    setFromVal(fStr)
    setToVal(tStr)
    apply(fStr, tStr)
  }

  const clear = () => {
    setFromVal("")
    setToVal("")
    router.push(pathname)
  }

  const hasFilter = from || to

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Presets */}
      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => applyPreset(p.days)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date range inputs */}
      <div className="flex items-center gap-1.5">
        <div className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <Input
            type="date"
            value={fromVal}
            onChange={(e) => setFromVal(e.target.value)}
            className="h-auto border-0 p-0 text-xs bg-transparent focus-visible:ring-0 w-28 text-foreground"
          />
          <span>–</span>
          <Input
            type="date"
            value={toVal}
            onChange={(e) => setToVal(e.target.value)}
            className="h-auto border-0 p-0 text-xs bg-transparent focus-visible:ring-0 w-28 text-foreground"
          />
        </div>
        <Button
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => apply(fromVal, toVal)}
          disabled={!fromVal && !toVal}
        >
          Aplicar
        </Button>
        {hasFilter && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clear}
            title="Limpar filtro"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
