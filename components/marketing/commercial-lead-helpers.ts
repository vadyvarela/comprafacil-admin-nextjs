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
      return "border-info-border bg-info-soft text-info-strong"
    case "CONTACTED":
      return "border-success-border bg-success-soft text-success-strong"
    case "NO_ANSWER":
      return "border-warning-border bg-warning-soft text-warning-strong"
    case "CONVERTED":
      return "border-highlight-border bg-highlight-soft text-highlight-strong"
    case "LOST":
      return "border-danger-border bg-danger-soft text-danger-strong"
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
