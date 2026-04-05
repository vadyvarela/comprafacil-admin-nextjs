"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Package2, Truck, CheckCircle2, XCircle, Loader2, Check } from "lucide-react"
import { updateOrderFulfillmentStatus } from "@/lib/actions/orderFulfillment"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STEPS = [
  { code: "PENDING",   label: "A processar", icon: Clock },
  { code: "PREPARING", label: "Em preparação", icon: Package2 },
  { code: "SHIPPED",   label: "Enviado", icon: Truck },
  { code: "DELIVERED", label: "Entregue", icon: CheckCircle2 },
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
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-xs font-bold text-foreground uppercase tracking-wide">Estado do envio</span>
        </div>
        <div className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-4.5 w-4.5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Pedido cancelado</p>
            <p className="text-xs text-muted-foreground mt-0.5">Este pedido foi marcado como cancelado</p>
          </div>
          <button
            onClick={() => handleChange("PENDING")}
            disabled={!!loading}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading === "PENDING" && <Loader2 className="h-3 w-3 animate-spin" />}
            Reativar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-xs font-bold text-foreground uppercase tracking-wide">Estado do envio</span>
        <button
          onClick={() => handleChange("CANCELLED")}
          disabled={!!loading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors disabled:opacity-50"
        >
          {loading === "CANCELLED" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          Cancelar pedido
        </button>
      </div>

      {/* Steps */}
      <div className="p-4">
        <div className="flex items-center">
          {STEPS.map((step, i) => {
            const isActive = step.code === currentCode
            const isDone = currentStepIndex > i
            const isPending = !isActive && !isDone
            const isLoading = loading === step.code
            const isLast = i === STEPS.length - 1
            const Icon = step.icon

            return (
              <div key={step.code} className="flex flex-1 items-center">
                <button
                  onClick={() => handleChange(step.code)}
                  disabled={!!loading || isActive}
                  title={step.label}
                  className={cn(
                    "flex flex-col items-center gap-2 flex-1 min-w-0 rounded-xl p-2.5 transition-all duration-150",
                    isActive && "cursor-default",
                    !isActive && !loading && "hover:bg-muted/50 cursor-pointer",
                    loading && !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                >
                  {/* Circle */}
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all",
                    isDone  && "border-emerald-500 bg-emerald-500",
                    isActive && "border-primary bg-primary",
                    isPending && "border-border bg-background"
                  )}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : isDone ? (
                      <Check className="h-4 w-4 text-white stroke-[2.5]" />
                    ) : (
                      <Icon className={cn(
                        "h-4 w-4",
                        isActive ? "text-primary-foreground" : "text-muted-foreground/50"
                      )} />
                    )}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    "text-[10px] font-semibold leading-tight text-center hidden sm:block",
                    isDone   && "text-emerald-600",
                    isActive && "text-primary",
                    isPending && "text-muted-foreground/50"
                  )}>
                    {step.label}
                  </span>
                </button>

                {/* Connector line */}
                {!isLast && (
                  <div className={cn(
                    "h-0.5 flex-1 mx-1 rounded-full transition-colors",
                    isDone ? "bg-emerald-400" : "bg-border"
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
