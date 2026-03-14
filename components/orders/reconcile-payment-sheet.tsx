"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { purchaseReconciliation } from "@/lib/actions/purchaseReconciliation"

export type ReconcilePaymentInitial = {
  referenceId?: string
  status?: "Completed" | "Error"
  statusReason?: string
  cardType?: string
  card?: string
}

type ReconcilePaymentSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ReconcilePaymentInitial
}

export function ReconcilePaymentSheet({
  open,
  onOpenChange,
  initial,
}: ReconcilePaymentSheetProps) {
  const router = useRouter()
  const [referenceId, setReferenceId] = useState(initial?.referenceId ?? "")
  const [status, setStatus] = useState<"Completed" | "Error">(
    initial?.status ?? "Completed"
  )
  const [statusReason, setStatusReason] = useState(initial?.statusReason ?? "")
  const [cardType, setCardType] = useState(initial?.cardType ?? "")
  const [card, setCard] = useState(initial?.card ?? "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setReferenceId(initial?.referenceId ?? "")
      setStatus(initial?.status ?? "Completed")
      setStatusReason(initial?.statusReason ?? "")
      setCardType(initial?.cardType ?? "")
      setCard(initial?.card ?? "")
    }
  }, [open, initial?.referenceId, initial?.status, initial?.statusReason, initial?.cardType, initial?.card])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const ref = referenceId.trim()
      if (!ref) {
        toast.error("Referência do pagamento é obrigatória.")
        return
      }
      setSaving(true)
      try {
        const result = await purchaseReconciliation({
          referenceId: ref,
          status,
          statusReason: statusReason.trim() || undefined,
          cardType: cardType.trim() || undefined,
          card: card.trim() || undefined,
        })
        if (result.ok) {
          toast.success("Reconciliação enviada com sucesso.")
          onOpenChange(false)
          router.refresh()
        } else {
          toast.error(result.message)
        }
      } finally {
        setSaving(false)
      }
    },
    [referenceId, status, statusReason, cardType, card, onOpenChange, router]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-xl"
      >
        <div className="border-b">
          <SheetHeader className="px-4 py-3">
            <SheetTitle className="text-lg">
              Reconciliação de pagamento
            </SheetTitle>
          </SheetHeader>
        </div>

        <form
          id="reconcile-payment-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Envia o estado do pagamento ao gateway (purchaseReconciliation).
              A referência é o <strong>merchantReference</strong> do payment intent.
            </p>
            <div className="space-y-2">
              <Label htmlFor="referenceId">Referência do pagamento *</Label>
              <Input
                id="referenceId"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="merchantReference do payment intent"
                required
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "Completed" | "Error")}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardType">Tipo de cartão</Label>
              <Input
                id="cardType"
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                placeholder="ex: Visa, Vinti4…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card">Cartão (últimos dígitos)</Label>
              <Input
                id="card"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                placeholder="ex: **** 1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusReason">Motivo / Observação</Label>
              <Input
                id="statusReason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="ex: Captura manual, reversão…"
              />
            </div>
          </div>

          <SheetFooter className="sticky bottom-0 z-10 border-t bg-background p-4">
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" form="reconcile-payment-form" disabled={saving}>
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A enviar…
                  </span>
                ) : (
                  "Enviar reconciliação"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
