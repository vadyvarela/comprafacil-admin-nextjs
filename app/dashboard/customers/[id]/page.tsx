import { notFound } from "next/navigation"
import Link from "next/link"
import { getCustomerDetails } from "@/lib/actions/customers"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, MapPin, Mail, Phone, Hash, Globe } from "lucide-react"
import type { AddressResponse } from "@/lib/graphql/customers/types"

function formatAddressLine(addr: {
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
}): string[] {
  const lines: string[] = []
  if (addr.address1?.trim()) lines.push(addr.address1.trim())
  if (addr.address2?.trim()) lines.push(addr.address2.trim())
  const cityState = [addr.city, addr.state].filter(Boolean).join(", ")
  const zipCountry = [addr.zip, addr.country].filter(Boolean).join(" ")
  const loc = [cityState, zipCountry].filter(Boolean).join(" — ")
  if (loc) lines.push(loc)
  return lines
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getCustomerDetails(id)

  if (!result.ok) {
    if (result.notFound) notFound()
    return (
      <>
        <DashboardHeader
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Clientes", href: "/dashboard/customers" },
            { label: "Detalhe" },
          ]}
        />
        <div className="flex flex-1 flex-col items-center justify-center min-h-[300px] p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto">
              <User className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="text-lg font-bold">Erro ao carregar cliente</h2>
            <p className="text-sm text-muted-foreground">{result.error}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/customers">Voltar aos clientes</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const customer = result.data
  const displayName = customer.name?.trim() || customer.email || customer.identifier || "Cliente"
  const initials = displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clientes", href: "/dashboard/customers" },
          { label: displayName.length > 24 ? `${displayName.slice(0, 24)}…` : displayName },
        ]}
      />
      <div className="flex flex-1 flex-col min-h-0 bg-grid">
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-4xl px-5 py-6 md:px-6 space-y-6">

            {/* Hero */}
            <div className="animate-enter relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-violet-500/[0.04] p-6">
              <div className="absolute inset-0 bg-grid opacity-30" />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 text-lg font-bold text-violet-300">
                    {initials}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">{displayName}</h1>
                    {customer.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                  <Link href="/dashboard/customers" className="inline-flex items-center">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    Voltar
                  </Link>
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="grid gap-5 lg:grid-cols-2 animate-enter-delay-1">
              {/* Data card */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
                    <User className="h-3 w-3 text-violet-400" />
                  </div>
                  <span className="text-xs font-semibold">Dados pessoais</span>
                </div>
                <div className="p-4 space-y-0">
                  {customer.name && (
                    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50">
                      <span className="text-[11px] text-muted-foreground">Nome</span>
                      <span className="text-xs font-medium text-right">{customer.name}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />Email</span>
                      <span className="text-xs font-medium break-all text-right">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />Telefone</span>
                      <span className="text-xs font-medium tabular-nums text-right">{customer.phone}</span>
                    </div>
                  )}
                  {customer.identifier && (
                    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" />Identificador</span>
                      <span className="font-mono text-[10px] break-all text-right">{customer.identifier}</span>
                    </div>
                  )}
                  {customer.customerExternalId && (
                    <div className="flex items-start justify-between gap-3 py-2.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />ID externo</span>
                      <span className="font-mono text-[10px] break-all text-right">{customer.customerExternalId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Addresses */}
              {customer.addresses && customer.addresses.length > 0 ? (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10">
                      <MapPin className="h-3 w-3 text-amber-400" />
                    </div>
                    <span className="text-xs font-semibold">Endereços</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {customer.addresses.length} endereço{customer.addresses.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {customer.addresses
                      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                      .map((addr: AddressResponse) => {
                        const lines = formatAddressLine(addr)
                        if (lines.length === 0) return null
                        return (
                          <div key={addr.id} className="px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              {addr.type?.description && (
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  {addr.type.description}
                                </span>
                              )}
                              {addr.isDefault && (
                                <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                                  padrão
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium leading-relaxed">{lines.join(", ")}</p>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                    <MapPin className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Nenhum endereço registado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
