"use client"

import type { MouseEvent } from "react"
import { useMutation } from "@apollo/client/react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DELETE_PAYMENT_INTENT } from "@/lib/graphql/transactions/mutations"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"

type TransactionDeleteButtonProps = {
  transactionId: string
  transactionLabel?: string
  redirectHref?: string
  showLabel?: boolean
  className?: string
  variant?: ButtonVariant
  size?: ButtonSize
  onDeleted?: () => void
}

function shortTransactionLabel(id: string): string {
  if (!id || id.length <= 8) return id
  return `#${id.slice(0, 8)}...`
}

export function TransactionDeleteButton({
  transactionId,
  transactionLabel,
  redirectHref,
  showLabel = false,
  className,
  variant = "ghost",
  size = "icon-sm",
  onDeleted,
}: TransactionDeleteButtonProps) {
  const router = useRouter()
  const [deletePaymentIntent, { loading }] = useMutation<
    { deletePaymentIntent?: { id: string } | null },
    { id: string }
  >(DELETE_PAYMENT_INTENT)

  const label = transactionLabel ?? shortTransactionLabel(transactionId)
  const buttonText = loading ? "A apagar..." : "Apagar"

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (loading) return

    const confirmed = window.confirm(
      `Apagar a transação ${label}? Esta ação não pode ser desfeita.`
    )
    if (!confirmed) return

    try {
      await deletePaymentIntent({ variables: { id: transactionId } })
      showToast.success("Transação apagada", `${label} foi removida.`)
      onDeleted?.()

      if (redirectHref) {
        router.push(redirectHref)
      }
      router.refresh()
    } catch (error: unknown) {
      showToast.error(
        "Erro ao apagar transação",
        getErrorMessage(error, "Não foi possível apagar a transação.")
      )
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
      onClick={handleDelete}
      aria-label={`Apagar transação ${label}`}
      title={`Apagar transação ${label}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      {showLabel && <span>{buttonText}</span>}
    </Button>
  )
}
