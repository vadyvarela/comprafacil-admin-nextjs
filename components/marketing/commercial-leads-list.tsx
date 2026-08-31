"use client"

import Link from "next/link"
import {
  CalendarClock,
  Copy,
  CreditCard,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DataPanel } from "@/components/admin/data-panel"
import type { CommercialRecoveryLead } from "@/lib/graphql/commercial-leads/types"
import { formatCurrency, minorToMajorCurrencyAmount } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import { showToast } from "@/lib/utils/toast"
import { CommercialLeadFollowUpDialog } from "./commercial-lead-follow-up-dialog"
import {
  customerName,
  followUpStatusClass,
  formatLeadDate,
  nextContactTone,
  paymentStatusClass,
  primaryContact,
  productName,
  statusLabel,
  telUrl,
  whatsappUrl,
} from "./commercial-lead-helpers"

type CommercialLeadsListProps = {
  leads: CommercialRecoveryLead[]
}

export function CommercialLeadsList({ leads }: CommercialLeadsListProps) {
  return (
    <>
      <DataPanel className="hidden xl:block">
        <Table role="grid" aria-label="Leads de recuperação">
          <TableHeader>
            <TableRow className="hover:bg-muted/45">
              <TableHead className="min-w-[180px] text-left text-xs font-semibold text-muted-foreground">
                Cliente
              </TableHead>
              <TableHead className="min-w-[180px] text-left text-xs font-semibold text-muted-foreground">
                Contacto
              </TableHead>
              <TableHead className="min-w-[180px] text-left text-xs font-semibold text-muted-foreground">
                Produto
              </TableHead>
              <TableHead className="w-[130px] text-right text-xs font-semibold text-muted-foreground">
                Valor
              </TableHead>
              <TableHead className="w-[90px] text-center text-xs font-semibold text-muted-foreground">
                Tentativas
              </TableHead>
              <TableHead className="w-[190px] text-left text-xs font-semibold text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="w-[150px] text-left text-xs font-semibold text-muted-foreground">
                Última tentativa
              </TableHead>
              <TableHead className="w-[150px] text-left text-xs font-semibold text-muted-foreground">
                Próxima chamada
              </TableHead>
              <TableHead className="w-[300px] text-right">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.key}
                className="border-border transition-colors hover:bg-muted/30"
              >
                <TableCell className="max-w-[220px] text-left">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {customerName(lead)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.customer.email || lead.customer.phone || "-"}
                  </p>
                </TableCell>
                <TableCell className="text-left">
                  <ContactLines lead={lead} />
                </TableCell>
                <TableCell className="max-w-[240px] text-left">
                  <p className="truncate text-sm font-medium text-foreground">
                    {productName(lead)}
                  </p>
                  <p className="truncate text-xs tabular-nums text-muted-foreground">
                    {lead.latestPayment.merchantReference || "-"}
                  </p>
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(
                    minorToMajorCurrencyAmount(lead.opportunityAmount),
                    lead.currency
                  )}
                </TableCell>
                <TableCell className="text-center text-sm font-semibold tabular-nums text-foreground">
                  {lead.attemptCount}
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex flex-col items-start gap-1">
                    <FollowUpStatusBadge lead={lead} />
                    <PaymentStatusBadge lead={lead} />
                  </div>
                </TableCell>
                <TableCell className="text-left text-xs tabular-nums text-muted-foreground">
                  {formatLeadDate(lead.lastAttemptAt)}
                </TableCell>
                <TableCell className="text-left">
                  <NextContact lead={lead} />
                </TableCell>
                <TableCell className="text-right">
                  <LeadActions lead={lead} compact />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataPanel>

      <div className="grid gap-3 xl:hidden">
        {leads.map((lead) => (
          <article
            key={lead.key}
            className="rounded-lg border border-border/80 bg-card p-3.5 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50">
                <Phone className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <FollowUpStatusBadge lead={lead} />
                  <PaymentStatusBadge lead={lead} />
                </div>
                <h2 className="mt-2 truncate text-sm font-semibold text-foreground">
                  {customerName(lead)}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {productName(lead)}
                </p>
                <p className="mt-2 text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(
                    minorToMajorCurrencyAmount(lead.opportunityAmount),
                    lead.currency
                  )}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 rounded-md border border-border/70 bg-muted/25 p-3 text-xs">
              <InfoLine icon={UserRound} label="Contacto" value={primaryContact(lead)} />
              <InfoLine
                icon={CreditCard}
                label="Tentativas"
                value={`${lead.attemptCount} · ${lead.latestPayment.merchantReference || "-"}`}
              />
              <InfoLine
                icon={CalendarClock}
                label="Última"
                value={formatLeadDate(lead.lastAttemptAt)}
              />
              <div className="flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="w-20 shrink-0 text-muted-foreground">Próxima</span>
                <NextContact lead={lead} />
              </div>
            </div>

            <div className="mt-3">
              <LeadActions lead={lead} />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function ContactLines({ lead }: { lead: CommercialRecoveryLead }) {
  return (
    <div className="space-y-0.5 text-xs text-muted-foreground">
      <p className="flex items-center gap-1.5">
        <Phone className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{lead.contactPhone || "-"}</span>
      </p>
      <p className="flex items-center gap-1.5">
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{lead.contactEmail || "-"}</span>
      </p>
    </div>
  )
}

function FollowUpStatusBadge({ lead }: { lead: CommercialRecoveryLead }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        followUpStatusClass(lead.computedStatus)
      )}
    >
      {statusLabel(lead.computedStatus)}
    </span>
  )
}

function PaymentStatusBadge({ lead }: { lead: CommercialRecoveryLead }) {
  const status = lead.latestPayment.status
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-default items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
            paymentStatusClass(status?.code)
          )}
        >
          {status?.description || status?.code || "-"}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="max-w-xs space-y-0.5 text-left">
          <p className="font-mono text-[11px] font-medium">{status?.code || "-"}</p>
          {lead.latestPayment.statusReason ? (
            <p className="text-[11px] leading-snug text-muted">
              Motivo: {lead.latestPayment.statusReason}
            </p>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function NextContact({ lead }: { lead: CommercialRecoveryLead }) {
  const tone = nextContactTone(lead.followUp?.nextContactAt)
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        tone === "due" && "font-semibold text-rose-600",
        tone === "scheduled" && "font-medium text-emerald-700",
        tone === "muted" && "text-muted-foreground"
      )}
    >
      {formatLeadDate(lead.followUp?.nextContactAt)}
    </span>
  )
}

function LeadActions({
  lead,
  compact = false,
}: {
  lead: CommercialRecoveryLead
  compact?: boolean
}) {
  const callHref = telUrl(lead.contactPhone)
  const waHref = whatsappUrl(lead.contactPhone)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        compact ? "justify-end" : "justify-start"
      )}
    >
      {callHref ? (
        <Button asChild size="icon-sm" variant="outline" title="Ligar">
          <a href={callHref} aria-label="Ligar">
            <Phone className="h-3.5 w-3.5" />
          </a>
        </Button>
      ) : (
        <Button size="icon-sm" variant="outline" disabled title="Sem telefone">
          <Phone className="h-3.5 w-3.5" />
        </Button>
      )}
      {waHref ? (
        <Button asChild size="icon-sm" variant="outline" title="Abrir WhatsApp">
          <a href={waHref} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp">
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
        </Button>
      ) : (
        <Button size="icon-sm" variant="outline" disabled title="Sem WhatsApp">
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
      )}
      <CopyContactButton lead={lead} />
      <Button asChild size="icon-sm" variant="outline" title="Abrir transação">
        <Link
          href={transactionHref(lead)}
          aria-label="Abrir transação"
        >
          <CreditCard className="h-3.5 w-3.5" />
        </Link>
      </Button>
      <Button asChild size="icon-sm" variant="outline" title="Abrir cliente">
        <Link href={`/dashboard/customers/${lead.customer.id}`} aria-label="Abrir cliente">
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </Button>
      <CommercialLeadFollowUpDialog lead={lead} />
    </div>
  )
}

function CopyContactButton({ lead }: { lead: CommercialRecoveryLead }) {
  async function copyContact() {
    const value = primaryContact(lead)
    if (!value || value === "-") {
      showToast.warning("Sem contacto", "Este lead não tem telefone nem email.")
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      showToast.success("Contacto copiado", value)
    } catch {
      showToast.error("Não foi possível copiar", value)
    }
  }

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="outline"
      title="Copiar contacto"
      aria-label="Copiar contacto"
      onClick={copyContact}
    >
      <Copy className="h-3.5 w-3.5" />
    </Button>
  )
}

function transactionHref(lead: CommercialRecoveryLead) {
  const params = new URLSearchParams({ id: lead.latestPayment.id })
  if (lead.latestPayment.merchantReference) {
    params.set("q", lead.latestPayment.merchantReference)
  }
  return `/dashboard/transactions?${params.toString()}`
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <p className="flex min-w-0 items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </p>
  )
}
