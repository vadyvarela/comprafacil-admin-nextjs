import { cn } from "@/lib/utils"

const statusConfig = {
  pending: { label: "Pendente", className: "badge-warning" },
  processing: { label: "Processando", className: "badge-info" },
  shipped: { label: "Enviado", className: "badge-purple" },
  delivered: { label: "Entregue", className: "badge-success" },
  cancelled: { label: "Cancelado", className: "badge-danger" },
  refunded: { label: "Reembolsado", className: "badge-warning" },
  active: { label: "Ativo", className: "badge-success" },
  inactive: { label: "Inativo", className: "badge-neutral" },
  expired: { label: "Expirado", className: "badge-danger" },
} as const

type StatusKey = keyof typeof statusConfig

export function StatusBadge({
  status,
  label: customLabel,
  className,
}: {
  status: string
  label?: string
  className?: string
}) {
  const key = status.toLowerCase() as StatusKey
  const config = statusConfig[key] ?? { label: status, className: "badge-neutral" }
  const label = customLabel ?? config.label

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.className,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
