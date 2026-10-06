"use client"

import { PageToolbar } from "@/components/admin/page-toolbar"
import { LoadError } from "@/components/admin/load-error"
import { useSearchParams } from "next/navigation"
import { Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClearFiltersButton } from "@/components/admin/clear-filters-button"

type CustomerListToolbarProps = {
  totalElements: number
  error?: string | null
}

export function CustomerListToolbar({ totalElements, error }: CustomerListToolbarProps) {
  const searchParams = useSearchParams()
  const search = searchParams.get("search") ?? ""

  return (
    <PageToolbar
      icon={Users}
      iconBg="bg-violet-50"
      iconColor="text-violet-700"
      title="Clientes"
      subtitle={
        <>
          {totalElements} cliente{totalElements !== 1 ? "s" : ""} registado{totalElements !== 1 ? "s" : ""}
        </>
      }
      footer={error ? <LoadError message={error} /> : null}
    >
      <form method="GET" className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto" role="search" aria-label="Buscar clientes">
        <input type="hidden" name="page" value="0" />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            name="search"
            placeholder="Nome, email, telefone…"
            defaultValue={search}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button type="submit" size="sm" className="h-8 text-xs">
          Buscar
        </Button>
        {search ? <ClearFiltersButton href="/dashboard/customers" /> : null}
      </form>
    </PageToolbar>
  )
}
