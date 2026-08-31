"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, PhoneCall, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { upsertCommercialLeadFollowUp } from "@/lib/actions/commercial-lead-follow-up"
import type {
  CommercialLeadFollowUpStatus,
  CommercialRecoveryLead,
} from "@/lib/graphql/commercial-leads/types"
import { showToast } from "@/lib/utils/toast"
import {
  FOLLOW_UP_STATUS_OPTIONS,
  customerName,
  productName,
} from "./commercial-lead-helpers"

type SavingState = "save" | "contacted" | null

type CommercialLeadFollowUpDialogProps = {
  lead: CommercialRecoveryLead
}

export function CommercialLeadFollowUpDialog({
  lead,
}: CommercialLeadFollowUpDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<CommercialLeadFollowUpStatus>(
    lead.followUp?.status ?? lead.computedStatus
  )
  const [note, setNote] = useState(lead.followUp?.note ?? "")
  const [nextContactAt, setNextContactAt] = useState(
    toDateTimeLocal(lead.followUp?.nextContactAt)
  )
  const [saving, setSaving] = useState<SavingState>(null)

  useEffect(() => {
    if (!open) return
    setStatus(lead.followUp?.status ?? lead.computedStatus)
    setNote(lead.followUp?.note ?? "")
    setNextContactAt(toDateTimeLocal(lead.followUp?.nextContactAt))
  }, [lead, open])

  async function handleSave(contactedNow: boolean) {
    if (saving) return
    setSaving(contactedNow ? "contacted" : "save")

    const result = await upsertCommercialLeadFollowUp({
      customerId: lead.customer.id,
      productId: lead.product.id,
      status,
      note: note.trim() || null,
      nextContactAt: fromDateTimeLocal(nextContactAt),
      contactedNow,
    })

    if (result.ok) {
      showToast.success(
        contactedNow ? "Contacto registado" : "Follow-up guardado",
        `${customerName(lead)} · ${productName(lead)}`
      )
      setOpen(false)
      router.refresh()
    } else {
      showToast.error("Erro ao guardar follow-up", result.error)
    }

    setSaving(null)
  }

  const isSaving = saving !== null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 px-2.5 text-xs"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Follow-up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Acompanhamento comercial</DialogTitle>
          <DialogDescription>
            {customerName(lead)} · {productName(lead)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Estado
            </label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as CommercialLeadFollowUpStatus)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolher estado" />
              </SelectTrigger>
              <SelectContent>
                {FOLLOW_UP_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Próxima chamada
            </label>
            <input
              type="datetime-local"
              value={nextContactAt}
              onChange={(event) => setNextContactAt(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/35"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Nota
            </label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              className="min-h-28 resize-y"
              placeholder="Resumo da conversa, preferência do cliente, melhor hora para ligar…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {saving === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar
          </Button>
          <Button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {saving === "contacted" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PhoneCall className="h-4 w-4" />
            )}
            Guardar e marcar contactado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function toDateTimeLocal(iso: string | null | undefined) {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromDateTimeLocal(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
