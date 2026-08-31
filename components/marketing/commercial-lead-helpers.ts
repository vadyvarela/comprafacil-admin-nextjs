import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type {
  CommercialLeadFollowUpStatus,
  CommercialRecoveryLead,
} from "@/lib/graphql/commercial-leads/types"

export const FOLLOW_UP_STATUS_OPTIONS: {
  value: CommercialLeadFollowUpStatus
  label: string
}[] = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contactado" },
  { value: "NO_ANSWER", label: "Sem resposta" },
  { value: "CONVERTED", label: "Convertido" },
  { value: "LOST", label: "Perdido" },
]

export const FOLLOW_UP_STATUS_LABELS: Record<CommercialLeadFollowUpStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contactado",
  NO_ANSWER: "Sem resposta",
  CONVERTED: "Convertido",
  LOST: "Perdido",
}

export function statusLabel(status: CommercialLeadFollowUpStatus) {
  return FOLLOW_UP_STATUS_LABELS[status] ?? status
}

export function followUpStatusClass(status: CommercialLeadFollowUpStatus) {
  switch (status) {
    case "NEW":
      return "border-sky-200 bg-sky-50 text-sky-700"
    case "CONTACTED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "NO_ANSWER":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "CONVERTED":
      return "border-violet-200 bg-violet-50 text-violet-700"
    case "LOST":
      return "border-rose-200 bg-rose-50 text-rose-700"
  }
}

export function paymentStatusClass(code: string | null | undefined) {
  const normalized = code?.toUpperCase() ?? ""
  if (normalized === "PS") return "badge-success"
  if (normalized === "PF" || normalized === "PC") return "badge-danger"
  if (normalized === "PP") return "badge-warning"
  if (normalized === "RA") return "badge-info"
  return "badge-neutral"
}

export function formatLeadDate(iso: string | null | undefined) {
  if (!iso) return "-"
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return "-"
  return format(parsed, "dd/MM/yyyy HH:mm", { locale: ptBR })
}

export function customerName(lead: CommercialRecoveryLead) {
  return lead.customer.name?.trim() || lead.contactEmail || lead.contactPhone || "-"
}

export function productName(lead: CommercialRecoveryLead) {
  return lead.product.title?.trim() || "Produto sem nome"
}

export function primaryContact(lead: CommercialRecoveryLead) {
  return lead.contactPhone?.trim() || lead.contactEmail?.trim() || "-"
}

export function normalizePhoneDigits(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, "") ?? ""
  if (!digits) return ""
  if (digits.startsWith("00")) return digits.slice(2)
  if (digits.length === 7) return `238${digits}`
  return digits
}

export function whatsappUrl(phone: string | null | undefined) {
  const digits = normalizePhoneDigits(phone)
  return digits ? `https://wa.me/${digits}` : null
}

export function telUrl(phone: string | null | undefined) {
  const digits = normalizePhoneDigits(phone)
  return digits ? `tel:+${digits}` : null
}

export function nextContactTone(iso: string | null | undefined) {
  if (!iso) return "muted"
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return "muted"
  return parsed.getTime() <= Date.now() ? "due" : "scheduled"
}
