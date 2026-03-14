import { notFound } from "next/navigation"
import Link from "next/link"
import { getCustomerDetails } from "@/lib/actions/customers"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, MapPin, Mail, Phone } from "lucide-react"
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
          <div className="text-center space-y-3 max-w-md">
            <User className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">Erro ao carregar cliente</h2>
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

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clientes", href: "/dashboard/customers" },
          { label: displayName.length > 24 ? `${displayName.slice(0, 24)}…` : displayName },
        ]}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <div className="border-b border-border bg-card">
          <div className="px-4 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-base font-semibold tracking-tight truncate">
                {displayName}
              </h1>
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link href="/dashboard/customers" className="inline-flex items-center">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="grid gap-4 lg:grid-cols-2 max-w-3xl">
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-3">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Dados</span>
              </div>
              <div className="space-y-2.5 text-xs">
                {customer.name && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Nome</p>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-start gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-muted-foreground mb-0.5">Email</p>
                      <p className="font-medium break-all">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-start gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-muted-foreground mb-0.5">Telefone</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                )}
                {customer.identifier && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Identificador</p>
                    <p className="font-mono text-[10px] break-all">{customer.identifier}</p>
                  </div>
                )}
                {customer.customerExternalId && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">ID externo</p>
                    <p className="font-mono text-[10px] break-all">{customer.customerExternalId}</p>
                  </div>
                )}
              </div>
            </div>

            {customer.addresses && customer.addresses.length > 0 && (
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Endereços</span>
                </div>
                <div className="space-y-3 text-xs">
                  {customer.addresses
                    .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                    .map((addr: AddressResponse) => {
                      const lines = formatAddressLine(addr)
                      if (lines.length === 0) return null
                      return (
                        <div key={addr.id} className="space-y-0.5">
                          {addr.type?.description && (
                            <p className="text-muted-foreground font-medium">
                              {addr.type.description}
                              {addr.isDefault && " (padrão)"}
                            </p>
                          )}
                          <p className="font-medium leading-snug">{lines.join(", ")}</p>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
