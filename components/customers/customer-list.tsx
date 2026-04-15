"use client"

import Link from "next/link"
import { Mail, Phone, Calendar, ArrowRight } from "lucide-react"
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

function getInitials(c: CustomerResponse): string {
  const name = displayName(c)
  if (name === "—") return "?"
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function shortId(id: string): string {
  if (!id || id.length < 8) return id
  return `${id.slice(0, 8)}…`
}

const AVATAR_COLORS = [
  "bg-gradient-to-br from-indigo-400 to-blue-600 text-white",
  "bg-gradient-to-br from-violet-400 to-purple-600 text-white",
  "bg-gradient-to-br from-emerald-400 to-teal-600 text-white",
  "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
  "bg-gradient-to-br from-rose-400 to-pink-600 text-white",
  "bg-gradient-to-br from-cyan-400 to-sky-600 text-white",
]

function avatarColor(id: string): string {
  const i = id.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}

export function CustomerList({ customers }: CustomerListProps) {
  return (
    <div>
      {/* Desktop */}
      <div className="hidden lg:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table role="grid" aria-label="Lista de clientes">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="min-w-[200px] text-xs font-semibold text-muted-foreground">Cliente</TableHead>
              <TableHead className="min-w-[180px] text-xs font-semibold text-muted-foreground">Email</TableHead>
              <TableHead className="w-[130px] text-xs font-semibold text-muted-foreground">Telefone</TableHead>
              <TableHead className="w-[110px] text-xs font-semibold text-muted-foreground">ID externo</TableHead>
              <TableHead className="w-[100px] text-xs font-semibold text-muted-foreground">Registado</TableHead>
              <TableHead className="w-10 px-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="border-border hover:bg-muted/30 transition-colors group"
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(customer.id)}`}
                    >
                      {getInitials(customer)}
                    </div>
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[150px]"
                    >
                      {displayName(customer)}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[180px] truncate text-xs">
                  {customer.email || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums text-xs">
                  {customer.phone || "—"}
                </TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">
                  {customer.customerExternalId ? shortId(customer.customerExternalId) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs tabular-nums">
                  {formatDate(customer.createdAt)}
                </TableCell>
                <TableCell className="px-3">
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label={`Ver ${displayName(customer)}`}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-2">
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/dashboard/customers/${customer.id}`}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all",
              "hover:border-primary/30 hover:shadow-md active:scale-[0.99]"
            )}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(customer.id)}`}
            >
              {getInitials(customer)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate mb-1">
                {displayName(customer)}
              </p>
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {customer.email && (
                  <span className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    {customer.email}
                  </span>
                )}
                {customer.phone && (
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Phone className="h-3 w-3 shrink-0" />
                    {customer.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
