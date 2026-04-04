"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Clock,
  Package2,
  Truck,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { updateOrderFulfillmentStatus } from "@/lib/actions/orderFulfillment"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    code: "PENDING",
    label: "A processar",
    sublabel: "Aguardando processamento",
    icon: Clock,
    activeBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    activeShadow: "shadow-amber-500/30",
    doneBg: "bg-amber-50 border-amber-200",
    doneText: "text-amber-600",
    lineColor: "#f59e0b",
  },
  {
    code: "PREPARING",
    label: "Em preparação",
    sublabel: "Preparando para envio",
    icon: Package2,
    activeBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    activeShadow: "shadow-blue-500/30",
    doneBg: "bg-blue-50 border-blue-200",
    doneText: "text-blue-600",
    lineColor: "#3b82f6",
  },
  {
    code: "SHIPPED",
    label: "Enviado",
    sublabel: "Em trânsito",
    icon: Truck,
    activeBg: "bg-gradient-to-br from-indigo-500 to-violet-600",
    activeShadow: "shadow-indigo-500/30",
    doneBg: "bg-indigo-50 border-indigo-200",
    doneText: "text-indigo-600",
    lineColor: "#6366f1",
  },
  {
    code: "DELIVERED",
    label: "Entregue",
    sublabel: "Entrega concluída",
    icon: CheckCircle2,
    activeBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    activeShadow: "shadow-emerald-500/30",
    doneBg: "bg-emerald-50 border-emerald-200",
    doneText: "text-emerald-600",
    lineColor: "#10b981",
  },
] as const

const STEP_CODES = STEPS.map((s) => s.code)
type FulfillmentCode = (typeof STEP_CODES)[number] | "CANCELLED"

type Props = {
  orderId: string
  fulfillmentStatus?: { code?: string; description?: string } | null
}

export function OrderFulfillmentStatus({ orderId, fulfillmentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const rawCode = fulfillmentStatus?.code?.toUpperCase() ?? "PENDING"
  const currentCode = rawCode as FulfillmentCode
  const isCancelled = currentCode === "CANCELLED"
  const currentStepIndex = STEP_CODES.indexOf(currentCode as any)

  async function handleChange(code: string) {
    if (code === currentCode || loading) return
    setLoading(code)
    const result = await updateOrderFulfillmentStatus(orderId, code)
    if (result.ok) {
      toast.success("Estado actualizado com sucesso.")
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setLoading(null)
  }

  if (isCancelled) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700">Pedido cancelado</p>
            <p className="text-xs text-red-500 mt-0.5">Este pedido foi marcado como cancelado</p>
          </div>
          <button
            onClick={() => handleChange("PENDING")}
            disabled={!!loading}
            className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
          >
            {loading === "PENDING" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Reativar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-xs font-bold text-foreground uppercase tracking-wide">Estado do envio</span>
        <button
          onClick={() => handleChange("CANCELLED")}
          disabled={!!loading}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {loading === "CANCELLED" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          Cancelar
        </button>
      </div>

      {/* Steps */}
      <div className="p-4">
        <div className="flex items-stretch gap-0">
          {STEPS.map((step, i) => {
            const isActive = step.code === currentCode
            const isDone = currentStepIndex > i
            const isPending = currentStepIndex < i
            const isLoading = loading === step.code
            const Icon = step.icon
            const isLast = i === STEPS.length - 1

            return (
              <div key={step.code} className="flex flex-1 items-center">
                {/* Step button */}
                <button
                  onClick={() => handleChange(step.code)}
                  disabled={!!loading || isActive}
                  title={step.sublabel}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-2 rounded-xl p-2.5 border transition-all duration-200 text-center min-w-0",
                    isActive && [
                      step.activeBg,
                      "border-transparent text-white shadow-md",
                      step.activeShadow,
                      "scale-[1.04] z-10 relative",
                    ],
                    isDone && [
                      step.doneBg,
                      step.doneText,
                      "cursor-pointer hover:opacity-90",
                    ],
                    isPending && [
                      "border-dashed border-border bg-transparent text-muted-foreground/50",
                      "hover:border-border hover:text-muted-foreground hover:bg-muted/20 cursor-pointer",
                    ],
                    loading && !isActive && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  {/* Icon circle */}
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                    isActive ? "bg-white/20" : isDone ? "bg-white/80 shadow-sm" : "bg-muted/40"
                  )}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isDone ? (
                      <CheckCircle2 className={cn("h-4 w-4", step.doneText)} />
                    ) : (
                      <Icon className={cn("h-4 w-4", isActive ? "text-white" : "")} />
                    )}
                  </div>
                  {/* Label */}
                  <span className={cn(
                    "text-[10px] font-bold leading-tight hidden sm:block",
                    isActive ? "text-white" : "",
                    isPending ? "text-muted-foreground/50" : ""
                  )}>
                    {step.label}
                  </span>
                </button>

                {/* Connector arrow */}
                {!isLast && (
                  <ChevronRight className={cn(
                    "h-4 w-4 shrink-0 mx-0.5",
                    isDone || isActive ? "text-muted-foreground" : "text-muted-foreground/25"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
