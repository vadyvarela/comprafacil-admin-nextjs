"use client"

import Link from "next/link"
import { User, Mail, Phone, Calendar, ArrowRight } from "lucide-react"
import type { CustomerResponse } from "@/lib/graphql/customers/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type CustomerListProps = {
  customers: CustomerResponse[]
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return "—"
  }
}

function displayName(c: CustomerResponse): string {
  if (c.name?.trim()) return c.name.trim()
  if (c.email?.trim()) return c.email.trim()
  if (c.identifier?.trim()) return c.identifier.trim()
  return "—"
}

function shortId(id: string): string {
  if (!id || id.length < 8) return id
  return `${id.slice(0, 8)}…`
}

export function CustomerList({ customers }: CustomerListProps) {
  return (
    <div className="space-y-0">
      <div className="hidden lg:block rounded-lg border border-border overflow-hidden bg-card shadow-sm">
        <Table role="grid" aria-label="Lista de clientes">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Cliente</TableHead>
              <TableHead className="min-w-[140px]">Email</TableHead>
              <TableHead className="w-[120px]">Telefone</TableHead>
              <TableHead className="w-[100px]">ID externo</TableHead>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead className="w-12 px-3" aria-label="Ações" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="border-border hover:bg-accent/40 transition-colors group"
              >
                <TableCell>
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                  >
                    {displayName(customer)}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[180px] truncate">
                  {customer.email || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {customer.phone || "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {customer.customerExternalId ? shortId(customer.customerExternalId) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs tabular-nums">
                  {formatDate(customer.createdAt)}
                </TableCell>
                <TableCell className="px-3">
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Ver cliente ${displayName(customer)}`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="lg:hidden space-y-3 mt-3">
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/dashboard/customers/${customer.id}`}
            className={cn(
              "block rounded-xl border border-border bg-card p-4 shadow-sm transition-all",
              "hover:border-primary/30 hover:shadow-md active:scale-[0.99]",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate mb-1">
                  {displayName(customer)}
                </p>
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  {customer.email && (
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {customer.email}
                    </span>
                  )}
                  {customer.phone && (
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {customer.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {formatDate(customer.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
