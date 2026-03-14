"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { ReconcilePaymentSheet } from "./reconcile-payment-sheet"

export function OrderDetailActions() {
  const [reconcileOpen, setReconcileOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setReconcileOpen(true)}
          className="inline-flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reconciliação
        </Button>
      </div>
      <ReconcilePaymentSheet
        open={reconcileOpen}
        onOpenChange={setReconcileOpen}
      />
    </>
  )
}
