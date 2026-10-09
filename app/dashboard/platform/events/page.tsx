import { Suspense } from "react"
import Link from "next/link"
import { AlertTriangle, ScrollText } from "lucide-react"
import { getPlatformEvents } from "@/lib/actions/platform"
import { requirePermissionPage } from "@/lib/auth/requirePermission"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { EmptyState } from "@/components/admin/empty-state"
import { LoadError } from "@/components/admin/load-error"
import { AuditLogPagination } from "@/components/logs/audit-log-pagination"
import { PlatformEventList } from "@/components/platform/platform-event-list"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

const LEVELS = [
  { value: "", label: "Tudo" },
  { value: "ERROR", label: "Erros" },
  { value: "WARN", label: "Avisos" },
  { value: "INFO", label: "Info" },
] as const

type PageProps = {
  searchParams: Promise<{ level?: string; page?: string }>
}

export default async function PlatformEventsPage({ searchParams }: PageProps) {
  await requirePermissionPage("platform.events.read")
  const params = await searchParams
  const level = LEVELS.find((l) => l.value === params.level)?.value ?? ""
  const page = Math.max(0, Math.floor(Number(params.page) || 0))

  const result = await getPlatformEvents({
    filter: { level: level || null },
    page: { page, size: PAGE_SIZE },
  })

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Plataforma" },
          { label: "Erros e alertas" },
        ]}
      />
      <div className="flex-1 space-y-4 overflow-auto p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav aria-label="Nível" className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <Link
                key={l.value}
                href={l.value ? `/dashboard/platform/events?level=${l.value}` : "/dashboard/platform/events"}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  l.value === level
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/dashboard/logs"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ScrollText className="size-3.5" />
            Actividade da loja (quem mudou o quê)
          </Link>
        </div>

        {!result.ok ? (
          <LoadError message={result.error} />
        ) : result.data.data.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nada a reportar"
            description="Erros do sistema, pagamentos falhados, vendas grandes e produtos esgotados aparecem aqui."
            tone="neutral"
          />
        ) : (
          <>
            <PlatformEventList events={result.data.data} />
            <Suspense fallback={null}>
              <AuditLogPagination
                currentPage={page}
                totalPages={result.data.totalPages}
                totalElements={result.data.totalElements}
                pageSize={PAGE_SIZE}
              />
            </Suspense>
          </>
        )}
      </div>
    </>
  )
}
