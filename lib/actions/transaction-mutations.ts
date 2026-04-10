"use server"

import { runGraphQL } from "./graphql"
import { CREATE_PAYMENT_INVOICE, CREATE_PAYMENT_RECEIPT } from "@/lib/graphql/transactions/queries"
import type { PaymentInvoice, PaymentReceipt } from "@/lib/graphql/transactions/types"

type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

interface CreateInvoiceResponse {
  createPaymentInvoice: PaymentInvoice
}

interface CreateReceiptResponse {
  createPaymentReceipt: PaymentReceipt
}

export async function createInvoiceAction(
  paymentId: string
): Promise<MutationResult<PaymentInvoice>> {
  const result = await runGraphQL<CreateInvoiceResponse>(CREATE_PAYMENT_INVOICE, { paymentId })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const invoice = result.data?.createPaymentInvoice
  if (!invoice) {
    return { ok: false, error: "Fatura não foi retornada pela API." }
  }

  return { ok: true, data: invoice }
}

export async function createReceiptAction(
  paymentId: string
): Promise<MutationResult<PaymentReceipt>> {
  const result = await runGraphQL<CreateReceiptResponse>(CREATE_PAYMENT_RECEIPT, { paymentId })

  if (result.errors?.length) {
    return { ok: false, error: result.errors.map((e) => e.message).join("; ") }
  }

  const receipt = result.data?.createPaymentReceipt
  if (!receipt) {
    return { ok: false, error: "Recibo não foi retornado pela API." }
  }

  return { ok: true, data: receipt }
}
