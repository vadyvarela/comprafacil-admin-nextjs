"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/admin/form-field"
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
  const { confirm, confirmDialog } = useConfirmDialog()

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
      const confirmed = await confirm({
        title: "Enviar reconciliação?",
        description: `Vai enviar o estado "${status === "Completed" ? "Pagamento confirmado" : "Erro no pagamento"}" para esta referência.`,
        impact: "Esta ação comunica com o gateway de pagamento. Confirme os dados antes de continuar.",
        confirmText: "Enviar reconciliação",
        variant: status === "Error" ? "destructive" : "default",
      })

      if (!confirmed) return

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
    [referenceId, status, statusReason, cardType, card, onOpenChange, router, confirm]
  )

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-xl"
        >
          <SheetHeader className="px-4 py-3 pr-12">
            <SheetTitle>
              Reconciliação de pagamento
            </SheetTitle>
            <SheetDescription>
              Use apenas quando for preciso alinhar manualmente o estado no gateway.
            </SheetDescription>
          </SheetHeader>

        <form
          id="reconcile-payment-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-auto p-4">
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              A referência corresponde ao <strong>merchantReference</strong> da transação. Confirme os dados antes de enviar.
            </p>
            <FormField label="Referência do pagamento *" htmlFor="referenceId">
              <Input
                id="referenceId"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Referência da transação"
                required
                className="font-mono text-sm"
              />
            </FormField>
            <FormField label="Estado" htmlFor="status">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "Completed" | "Error")}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Pagamento confirmado</SelectItem>
                  <SelectItem value="Error">Erro no pagamento</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Tipo de cartão" htmlFor="cardType">
              <Input
                id="cardType"
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                placeholder="ex: Visa, Vinti4…"
              />
            </FormField>
            <FormField label="Cartão (últimos dígitos)" htmlFor="card">
              <Input
                id="card"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                placeholder="ex: **** 1234"
              />
            </FormField>
            <FormField label="Motivo / Observação" htmlFor="statusReason">
              <Input
                id="statusReason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="ex: Captura manual, reversão…"
              />
            </FormField>
          </div>

          <SheetFooter className="sticky bottom-0 z-10">
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
      {confirmDialog}
    </>
  )
}
