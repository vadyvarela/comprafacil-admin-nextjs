"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileText, Receipt, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createInvoiceAction, createReceiptAction } from "@/lib/actions/transaction-mutations"

type Props = {
  paymentId: string
  hasInvoice: boolean
  hasReceipt: boolean
}

type ActionState = "idle" | "loading" | "success" | "error"

export function TransactionCreateDocButtons({ paymentId, hasInvoice, hasReceipt }: Props) {
  const router = useRouter()
  const [invoiceState, setInvoiceState] = useState<ActionState>("idle")
  const [receiptState, setReceiptState] = useState<ActionState>("idle")
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleCreateInvoice() {
    setInvoiceState("loading")
    setInvoiceError(null)
    const result = await createInvoiceAction(paymentId)
    if (result.ok) {
      setInvoiceState("success")
      startTransition(() => router.refresh())
    } else {
      setInvoiceState("error")
      setInvoiceError(result.error)
    }
  }

  async function handleCreateReceipt() {
    setReceiptState("loading")
    setReceiptError(null)
    const result = await createReceiptAction(paymentId)
    if (result.ok) {
      setReceiptState("success")
      startTransition(() => router.refresh())
    } else {
      setReceiptState("error")
      setReceiptError(result.error)
    }
  }

  // Não mostrar nada se ambos já existem
  if (hasInvoice && hasReceipt) return null

  return (
    <div className="flex flex-col gap-2">
      {!hasInvoice && (
        <div className="flex flex-col gap-1">
          <Button
            variant="default"
            size="sm"
            className="h-9 text-xs gap-2 w-full font-semibold"
            onClick={handleCreateInvoice}
            disabled={invoiceState === "loading" || invoiceState === "success" || isPending}
          >
            {invoiceState === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : invoiceState === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            {invoiceState === "success" ? "Fatura criada!" : "Criar fatura"}
          </Button>
          {invoiceState === "error" && invoiceError && (
            <p className="flex items-start gap-1 text-[11px] text-red-500">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
              {invoiceError}
            </p>
          )}
        </div>
      )}

      {!hasReceipt && (
        <div className="flex flex-col gap-1">
          <Button
            variant={hasInvoice ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs gap-2 w-full font-semibold"
            onClick={handleCreateReceipt}
            disabled={
              receiptState === "loading" ||
              receiptState === "success" ||
              isPending ||
              (!hasInvoice && invoiceState !== "success")
            }
          >
            {receiptState === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : receiptState === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Receipt className="h-3.5 w-3.5" />
            )}
            {receiptState === "success" ? "Recibo criado!" : "Criar recibo"}
          </Button>
          {!hasInvoice && invoiceState !== "success" && (
            <p className="text-[11px] text-muted-foreground pl-0.5">
              Requer fatura criada primeiro.
            </p>
          )}
          {receiptState === "error" && receiptError && (
            <p className="flex items-start gap-1 text-[11px] text-red-500">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
              {receiptError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
