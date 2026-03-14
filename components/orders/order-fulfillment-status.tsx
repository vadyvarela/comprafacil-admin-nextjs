"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FULFILLMENT_OPTIONS,
  getFulfillmentStatusLabel,
  getFulfillmentStatusVariant,
} from "@/lib/orders/status"
import { updateOrderFulfillmentStatus } from "@/lib/actions/orderFulfillment"
import { toast } from "sonner"
import { Package } from "lucide-react"

type OrderFulfillmentStatusProps = {
  orderId: string
  fulfillmentStatus?: { code?: string; description?: string } | null
}

export function OrderFulfillmentStatus({
  orderId,
  fulfillmentStatus,
}: OrderFulfillmentStatusProps) {
  const router = useRouter()
  const currentCode = fulfillmentStatus?.code ?? null

  async function handleChange(value: string) {
    const result = await updateOrderFulfillmentStatus(orderId, value)
    if (result.ok) {
      toast.success("Estado atualizado.")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Estado do pedido
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={currentCode ?? "PENDING"}
          onValueChange={handleChange}
        >
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue placeholder="Selecionar estado" />
          </SelectTrigger>
          <SelectContent>
            {FULFILLMENT_OPTIONS.map((opt) => (
              <SelectItem key={opt.code} value={opt.code}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge
          variant={getFulfillmentStatusVariant(currentCode)}
          className="text-xs font-normal"
        >
          {getFulfillmentStatusLabel(currentCode)}
        </Badge>
      </div>
    </div>
  )
}
