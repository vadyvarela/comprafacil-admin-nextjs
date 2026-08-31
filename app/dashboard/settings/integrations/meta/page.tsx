import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetaUrlField } from "@/components/settings/meta-url-field"
import {
  fetchMetaDiagnostics,
  type MetaCatalogHealthSummary,
  type MetaDiagnosticsLastEvent,
} from "@/lib/actions/meta-diagnostics"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

const ISSUE_LABELS: Record<string, string> = {
  missing_id: "Sem ID",
  duplicate_id: "ID duplicado",
  missing_title: "Sem título",
  missing_image: "Sem imagem",
  invalid_url: "URL inválida",
  invalid_price: "Preço inválido",
  invalid_availability: "Disponibilidade inválida",
  duplicate_variant: "Variante duplicada",
  missing_item_group_id: "Sem grupo de variantes",
}

function issueLabel(type: string): string {
  return ISSUE_LABELS[type] ?? type
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }
    >
      {ok ? (
        <CheckCircle2 className="mr-1 size-3.5" />
      ) : (
        <AlertTriangle className="mr-1 size-3.5" />
      )}
      {label}
    </Badge>
  )
}

function CatalogHealthPanel({
  health,
  error,
}: {
  health: MetaCatalogHealthSummary | null
  error: string | null
}) {
  if (error) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Health check indisponível</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
        Sem health check do catálogo.
      </div>
    )
  }

  const issueEntries = Object.entries(health.counts)
    .filter(([, count]) => count > 0)
    .slice(0, 6)
  const validPercent =
    health.totalRows > 0
      ? Math.round((health.validRows / health.totalRows) * 100)
      : 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          ok={health.issueCount === 0}
          label={health.issueCount === 0 ? "Feed saudável" : "Feed com avisos"}
        />
        <Badge variant="outline">{validPercent}% válido</Badge>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Linhas</p>
          <p className="font-medium">{health.totalRows}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Válidas</p>
          <p className="font-medium">{health.validRows}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Avisos</p>
          <p className="font-medium">{health.issueCount}</p>
        </div>
      </div>

      {issueEntries.length > 0 ? (
        <div className="space-y-1.5">
          {issueEntries.map(([type, count]) => (
            <div
              key={type}
              className="flex items-center justify-between gap-3 rounded-md bg-muted/35 px-2.5 py-1.5 text-xs"
            >
              <span className="text-muted-foreground">{issueLabel(type)}</span>
              <span className="font-medium text-foreground">{count}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function EventRow({
  label,
  event,
}: {
  label: string
  event: MetaDiagnosticsLastEvent | null | undefined
}) {
  if (!event) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">sem eventos</span>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {event.productId
            ? `produto ${event.productId}`
            : event.orderId
              ? `pedido ${event.orderId}`
              : event.page || "—"}
        </p>
      </div>
      <time className="shrink-0 text-xs text-muted-foreground">
        {new Date(event.createdAt).toLocaleString("pt-CV")}
      </time>
    </div>
  )
}

export default async function MetaIntegrationsPage() {
  const result = await fetchMetaDiagnostics()

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições", href: "/dashboard/settings" },
          { label: "Integrações Meta" },
        ]}
      />
      <SettingsSubnav />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <PageHeader
          title="Integrações Meta"
          description="Diagnóstico interno do Pixel, CAPI, catálogo e tracking. Sem tokens nem dados pessoais."
        />

        {!result.ok ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex items-start gap-3 py-4 text-sm text-destructive">
              <XCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Não foi possível carregar o diagnóstico</p>
                <p className="mt-1 text-destructive/80">{result.message}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Gerado em {new Date(result.data.generatedAt).toLocaleString("pt-CV")}
            </p>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Meta Commerce</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MetaUrlField
                    id="meta-catalog-feed-url"
                    label="URL do catálogo"
                    value={result.data.commerce.catalogFeedUrl}
                  />
                  <MetaUrlField
                    id="meta-catalog-health-url"
                    label="URL de validação"
                    value={result.data.commerce.catalogHealthUrl}
                  />
                  <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Commerce Manager</p>
                    <p className="mt-1">
                      Criar catálogo, escolher Data Feed por URL, colar a URL do
                      catálogo e agendar actualização automática.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Health do feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <CatalogHealthPanel
                    health={result.data.commerce.catalogHealth}
                    error={result.data.commerce.catalogHealthError}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Configuração</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <StatusBadge
                    ok={result.data.configuration.pixelConfigured}
                    label={
                      result.data.configuration.pixelConfigured
                        ? "Pixel configurado"
                        : "Pixel em falta"
                    }
                  />
                  <StatusBadge
                    ok={result.data.configuration.capiConfigured}
                    label={
                      result.data.configuration.capiConfigured
                        ? "CAPI configurado"
                        : "CAPI em falta"
                    }
                  />
                  <StatusBadge
                    ok={result.data.configuration.catalogAvailable}
                    label={
                      result.data.configuration.catalogAvailable
                        ? "Catálogo disponível"
                        : "Catálogo vazio"
                    }
                  />
                  <StatusBadge
                    ok={!result.data.configuration.testMode}
                    label={
                      result.data.configuration.testMode
                        ? "Test mode activo"
                        : "Test mode inactivo"
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Catálogo</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Produtos</p>
                    <p className="font-medium">{result.data.catalog.totalProducts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Variantes</p>
                    <p className="font-medium">{result.data.catalog.totalVariants}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sem imagem</p>
                    <p className="font-medium">
                      {result.data.catalog.productsMissingImage}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sem preço</p>
                    <p className="font-medium">
                      {result.data.catalog.productsMissingPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sem stock</p>
                    <p className="font-medium">
                      {result.data.catalog.productsMissingStock}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Excluídos (est.)</p>
                    <p className="font-medium">
                      {result.data.catalog.productsExcludedEstimate}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tracking interno</CardTitle>
                </CardHeader>
                <CardContent>
                  <EventRow
                    label="ViewContent"
                    event={result.data.tracking.lastEvents.product_view}
                  />
                  <EventRow
                    label="AddToCart"
                    event={result.data.tracking.lastEvents.add_to_cart}
                  />
                  <EventRow
                    label="InitiateCheckout"
                    event={result.data.tracking.lastEvents.begin_checkout}
                  />
                  <EventRow
                    label="Purchase"
                    event={result.data.tracking.lastEvents.purchase}
                  />
                  <EventRow
                    label="Search"
                    event={result.data.tracking.lastEvents.search}
                  />
                  <EventRow
                    label="Contact"
                    event={result.data.tracking.lastEvents.contact}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Último erro CAPI</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {result.data.tracking.lastCapiError ? (
                    <div className="space-y-2">
                      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
                        {result.data.tracking.lastCapiError.status || "error"}
                      </Badge>
                      <p className="text-foreground">
                        {result.data.tracking.lastCapiError.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.data.tracking.lastCapiError.eventName || "Purchase"}
                        {result.data.tracking.lastCapiError.orderId
                          ? ` · pedido ${result.data.tracking.lastCapiError.orderId}`
                          : ""}
                        {" · "}
                        {new Date(
                          result.data.tracking.lastCapiError.createdAt
                        ).toLocaleString("pt-CV")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum erro CAPI registado.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
