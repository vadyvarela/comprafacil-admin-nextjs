"use client"

import { useLazyQuery } from "@apollo/client/react"
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CHECK_TRANSACTION_STATUS } from "@/lib/graphql/transactions/queries"
import type {
  CheckTransactionStatusResponse,
  SispTransactionStatusResponse,
} from "@/lib/graphql/transactions/types"
import { showToast } from "@/lib/utils/toast"
import { getErrorMessage } from "@/lib/utils/errors"

type TransactionSispStatusProps = {
  merchantReference: string
}

export function TransactionSispStatus({ merchantReference }: TransactionSispStatusProps) {
  const [checkStatus, { data, loading, called }] = useLazyQuery<
    CheckTransactionStatusResponse,
    { merchantRef: string }
  >(CHECK_TRANSACTION_STATUS, {
    fetchPolicy: "network-only",
  })

  const result = data?.checkTransactionStatus ?? null

  async function handleCheck() {
    if (loading || !merchantReference.trim()) return

    try {
      const response = await checkStatus({
        variables: { merchantRef: merchantReference.trim() },
      })
      if (response.error) {
        showToast.error(
          "Erro ao consultar SISP",
          getErrorMessage(response.error, "Não foi possível consultar o estado.")
        )
      }
    } catch (error: unknown) {
      showToast.error(
        "Erro ao consultar SISP",
        getErrorMessage(error, "Não foi possível consultar o estado.")
      )
    }
  }

  return (
    <div className="space-y-2 border-t border-border/60 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground uppercase">
          Estado SISP
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          disabled={loading || !merchantReference.trim()}
          onClick={handleCheck}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {loading ? "A consultar…" : called ? "Consultar novamente" : "Consultar no SISP"}
        </Button>
      </div>

      {result && <SispStatusResult result={result} />}
    </div>
  )
}

function SispStatusResult({ result }: { result: SispTransactionStatusResponse }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 space-y-1.5">
      <StatusLine
        ok={result.searchResult}
        label="Consulta"
        detail={result.searchResultMsg || "—"}
      />
      <StatusLine
        ok={result.transactionSuccess}
        label="Pagamento"
        detail={result.message || "—"}
      />
    </div>
  )
}

function StatusLine({
  ok,
  label,
  detail,
}: {
  ok: boolean
  label: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-foreground leading-tight">
          {label}:{" "}
          <span className={ok ? "text-emerald-700" : "text-amber-700"}>
            {ok ? "Sim" : "Não"}
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground wrap-break-word leading-snug">{detail}</p>
      </div>
    </div>
  )
}
