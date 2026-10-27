import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getPlatformStores } from "@/lib/actions/platform"
import { can, getPrincipal } from "@/lib/auth/principal"
import { requirePermissionPage } from "@/lib/auth/requirePermission"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { LoadError } from "@/components/admin/load-error"
import { DataPanel } from "@/components/admin/data-panel"
import { CreateStoreForm } from "@/components/platform/create-store-form"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activa",
  SUSPENDED: "Suspensa",
  ARCHIVED: "Arquivada",
}

function formatCommission(rate: number | null | undefined): string {
  if (rate == null) return "Por omissão"
  return `${(rate * 100).toLocaleString("pt-PT", { maximumFractionDigits: 2 })}%`
}

export default async function PlatformStoresPage() {
  await requirePermissionPage("platform.stores.read")
  const [result, principal] = await Promise.all([getPlatformStores(), getPrincipal()])

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Plataforma" },
          { label: "Lojas" },
        ]}
      />
      <div className="flex-1 space-y-4 overflow-auto p-5">
        {!result.ok ? (
          <LoadError message={result.error} />
        ) : (
          <DataPanel>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/45">
                  <TableHead>Loja</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-right">Criada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{store.slug}</TableCell>
                    <TableCell>{STATUS_LABELS[store.status] ?? store.status}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCommission(store.commissionRate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {format(new Date(store.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataPanel>
        )}
        {can(principal, "platform.stores.write") && <CreateStoreForm />}
      </div>
    </>
  )
}
