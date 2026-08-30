"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Package2, Truck, CheckCircle2, XCircle, Loader2, Check } from "lucide-react"
import { updateOrderFulfillmentStatus } from "@/lib/actions/orderFulfillment"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DataPanel } from "@/components/admin/data-panel"

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
  canManage?: boolean
}

export function OrderFulfillmentStatus({ orderId, fulfillmentStatus, canManage = true }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const { confirm, confirmDialog } = useConfirmDialog()

  const rawCode = fulfillmentStatus?.code?.toUpperCase() ?? "PENDING"
  const currentCode = rawCode as FulfillmentCode
  const isCancelled = currentCode === "CANCELLED"
  const currentStepIndex = STEP_CODES.findIndex((code) => code === currentCode)

  async function confirmStatusChange(code: string) {
    const target = STEPS.find((step) => step.code === code)
    const targetIndex = STEP_CODES.findIndex((stepCode) => stepCode === code)

    if (code === "CANCELLED") {
      return confirm({
        title: "Cancelar pedido?",
        description: "Está prestes a marcar este pedido como cancelado.",
        impact: "O histórico do pedido será actualizado e a equipa verá o pedido como cancelado. Use apenas quando a operação foi realmente cancelada.",
        confirmText: "Cancelar pedido",
        variant: "critical",
        requireText: "CANCELAR",
      })
    }

    if (isCancelled && code === "PENDING") {
      return confirm({
        title: "Reativar pedido?",
        description: "Está prestes a voltar este pedido para o estado A processar.",
        impact: "A equipa operacional voltará a tratar este pedido como ativo.",
        confirmText: "Reativar pedido",
        variant: "destructive",
      })
    }

    if (code === "DELIVERED") {
      return confirm({
        title: "Marcar como entregue?",
        description: "Confirme que o cliente já recebeu este pedido.",
        impact: "O pedido será apresentado como entregue no backoffice.",
        confirmText: "Marcar entregue",
        variant: "default",
      })
    }

    if (currentStepIndex >= 0 && targetIndex >= 0 && targetIndex > currentStepIndex + 1) {
      return confirm({
        title: "Saltar etapas?",
        description: `Está prestes a avançar diretamente para "${target?.label ?? code}".`,
        impact: "Confirme que as etapas anteriores já foram concluídas fora do sistema.",
        confirmText: "Avançar estado",
        variant: "destructive",
      })
    }

    if (currentStepIndex >= 0 && targetIndex >= 0 && targetIndex < currentStepIndex) {
      return confirm({
        title: "Voltar estado?",
        description: `Está prestes a voltar o pedido para "${target?.label ?? code}".`,
        impact: "Esta mudança pode confundir a operação se o pedido já avançou fisicamente.",
        confirmText: "Voltar estado",
        variant: "destructive",
      })
    }

    return true
  }

  async function handleChange(code: string) {
    if (!canManage || code === currentCode || loading) return
    const confirmed = await confirmStatusChange(code)
    if (!confirmed) return

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
      <DataPanel>
        <div className="flex items-center justify-between border-b border-border bg-muted/35 px-4 py-3">
          <span className="text-xs font-bold text-foreground uppercase">Estado do envio</span>
        </div>
        <div className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-4.5 w-4.5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Pedido cancelado</p>
            <p className="text-xs text-muted-foreground mt-0.5">Este pedido foi marcado como cancelado</p>
          </div>
          {canManage ? (
            <button
              onClick={() => handleChange("PENDING")}
              disabled={!!loading}
              className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {loading === "PENDING" && <Loader2 className="h-3 w-3 animate-spin" />}
              Reativar
            </button>
          ) : (
            <span className="shrink-0 rounded-md border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Modo leitura
            </span>
          )}
        </div>
        {confirmDialog}
      </DataPanel>
    )
  }

  return (
    <DataPanel>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/35 px-4 py-3">
        <span className="text-xs font-bold text-foreground uppercase">Estado do envio</span>
        {canManage ? (
          <button
            onClick={() => handleChange("CANCELLED")}
            disabled={!!loading}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors disabled:opacity-50"
          >
            {loading === "CANCELLED" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            Cancelar pedido
          </button>
        ) : (
          <span className="rounded-md border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Modo leitura
          </span>
        )}
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
                  disabled={!canManage || !!loading || isActive}
                  title={step.label}
                  className={cn(
                    "flex flex-col items-center gap-2 flex-1 min-w-0 rounded-md border p-2.5 transition-all duration-150",
                    isActive && "cursor-default border-border/80 bg-muted/20",
                    !isActive && "border-transparent",
                    !isActive && !loading && canManage && "hover:bg-muted/50 hover:border-border/60 cursor-pointer",
                    (!canManage || loading) && !isActive && "opacity-60 cursor-not-allowed pointer-events-none"
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
      {confirmDialog}
    </DataPanel>
  )
}
