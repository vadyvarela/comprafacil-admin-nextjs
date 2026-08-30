"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { StoreImageField } from "@/components/settings/store-image-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { GET_STORE_SETTINGS } from "@/lib/graphql/store-settings/queries"
import { UPDATE_STORE_SETTINGS } from "@/lib/graphql/store-settings/mutations"
import type {
  StoreSettingsGql,
  StoreSettingsMutationData,
  StoreSettingsQueryData,
} from "@/lib/graphql/store-settings/types"
import { ProductPageTrustBadgesSection } from "@/components/settings/product-page-trust-badges-section"
import { ProductPageLayoutSection } from "@/components/settings/product-page-layout-section"
import {
  parseProductPageLayout,
  serializeProductPageLayout,
  type ProductPageLayout,
} from "@/lib/product-page-layout"
import {
  parseProductPageTrustBadges,
  serializeProductPageTrustBadges,
  type ProductPageTrustBadges,
} from "@/lib/product-page-trust-badges"
import { CheckCircle2, Copy, ExternalLink, Loader2, Megaphone } from "lucide-react"
import { toast } from "sonner"

type StoreDraft = {
  siteName: string
  siteDescription: string
  logoUrl: string
  footerLogoUrl: string
  faviconUrl: string
  ogImageUrl: string
  supportEmail: string
  supportPhonePrimary: string
  supportPhoneSecondary: string
  nif: string
  address: string
  facebookUrl: string
  instagramUrl: string
  whatsappNumber: string
  metaPixelId: string
  popularSearchQueriesText: string
  productPageTrustBadges: ProductPageTrustBadges
  productPageLayout: ProductPageLayout
}

function queriesToText(queries: string[] | null | undefined): string {
  return (queries ?? []).join("\n")
}

function textToQueries(text: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
    if (result.length >= 8) break
  }
  return result
}

function rowToDraft(row: StoreSettingsGql): StoreDraft {
  return {
    siteName: row.siteName ?? "",
    siteDescription: row.siteDescription?.trim() ?? "",
    logoUrl: row.logoUrl?.trim() ?? "",
    footerLogoUrl: row.footerLogoUrl?.trim() ?? "",
    faviconUrl: row.faviconUrl?.trim() ?? "",
    ogImageUrl: row.ogImageUrl?.trim() ?? "",
    supportEmail: row.supportEmail?.trim() ?? "",
    supportPhonePrimary: row.supportPhonePrimary?.trim() ?? "",
    supportPhoneSecondary: row.supportPhoneSecondary?.trim() ?? "",
    nif: row.nif?.trim() ?? "",
    address: row.address?.trim() ?? "",
    facebookUrl: row.facebookUrl?.trim() ?? "",
    instagramUrl: row.instagramUrl?.trim() ?? "",
    whatsappNumber: row.whatsappNumber?.trim() ?? "",
    metaPixelId: row.metaPixelId?.trim() ?? "",
    popularSearchQueriesText: queriesToText(row.popularSearchQueries),
    productPageTrustBadges: parseProductPageTrustBadges(row.productPageTrustBadges),
    productPageLayout: parseProductPageLayout(row.productPageLayout),
  }
}

function emptyDraft(): StoreDraft {
  return rowToDraft({ siteName: "" })
}

export default function StoreSettingsPage() {
  const { data, loading, error, refetch } = useQuery<StoreSettingsQueryData>(GET_STORE_SETTINGS)
  const [updateSettings, { loading: saving }] = useMutation<StoreSettingsMutationData>(
    UPDATE_STORE_SETTINGS,
    { refetchQueries: [{ query: GET_STORE_SETTINGS }] }
  )

  const row = data?.storeSettings
  const serverVersion = row?.updatedAt ?? "__empty__"
  const [draft, setDraft] = useState<{ version: string; values: StoreDraft } | null>(null)
  const serverDraft = row ? rowToDraft(row) : emptyDraft()
  const activeDraft = draft?.version === serverVersion ? draft.values : null
  const values = activeDraft ?? serverDraft
  const dirty = activeDraft !== null
  const storeOrigin = (
    process.env.NEXT_PUBLIC_TECHARENA_URL?.trim() ||
    process.env.NEXT_PUBLIC_STORE_URL?.trim() ||
    "https://kumprafacil.cv"
  ).replace(/\/$/, "")
  const catalogFeedUrl = `${storeOrigin}/api/meta/catalog`

  function patch(partial: Partial<StoreDraft>) {
    setDraft((prev) => ({
      version: serverVersion,
      values: { ...((prev?.version === serverVersion ? prev.values : null) ?? serverDraft), ...partial },
    }))
  }

  async function handleSave() {
    const name = values.siteName.trim()
    if (!name) {
      toast.error("Nome da loja é obrigatório")
      return
    }
    try {
      await updateSettings({
        variables: {
          siteName: name,
          siteDescription: values.siteDescription.trim() || null,
          logoUrl: values.logoUrl.trim() || null,
          footerLogoUrl: values.footerLogoUrl.trim() || null,
          faviconUrl: values.faviconUrl.trim() || null,
          ogImageUrl: values.ogImageUrl.trim() || null,
          supportEmail: values.supportEmail.trim() || null,
          supportPhonePrimary: values.supportPhonePrimary.trim() || null,
          supportPhoneSecondary: values.supportPhoneSecondary.trim() || null,
          nif: values.nif.trim() || null,
          address: values.address.trim() || null,
          facebookUrl: values.facebookUrl.trim() || null,
          instagramUrl: values.instagramUrl.trim() || null,
          whatsappNumber: values.whatsappNumber.trim() || null,
          metaPixelId: values.metaPixelId.trim() || null,
          popularSearchQueries: textToQueries(values.popularSearchQueriesText),
          productPageTrustBadges: serializeProductPageTrustBadges(values.productPageTrustBadges),
          productPageLayout: serializeProductPageLayout(values.productPageLayout),
        },
      })
      setDraft(null)
      toast.success("Definições da loja guardadas")
      await refetch()
    } catch (e) {
      toast.error("Não foi possível guardar", {
        description: e instanceof Error ? e.message : "Erro desconhecido",
      })
    }
  }

  async function copyCatalogFeedUrl() {
    try {
      await navigator.clipboard.writeText(catalogFeedUrl)
      toast.success("URL do catálogo copiada")
    } catch {
      toast.error("Não foi possível copiar a URL")
    }
  }

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições", href: "/dashboard/settings" },
          { label: "Loja" },
        ]}
      />
      <SettingsSubnav />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <PageHeader
          title="Loja"
          description="Nome, logotipo, contactos e imagens SEO da loja pública."
        />

        {error ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">
              Erro ao carregar: {error.message}
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="grid gap-3 max-w-2xl">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Identidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Nome da loja</Label>
                  <Input
                    id="site-name"
                    value={values.siteName}
                    onChange={(e) => patch({ siteName: e.target.value })}
                    placeholder="Nome da loja"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-description">Descrição</Label>
                  <Textarea
                    id="site-description"
                    rows={3}
                    value={values.siteDescription}
                    onChange={(e) => patch({ siteDescription: e.target.value })}
                    placeholder="Texto SEO e tagline do footer"
                    className="resize-y min-h-[72px] text-sm"
                  />
                </div>
                <StoreImageField
                  id="logo-header"
                  label="Logotipo (header)"
                  hint="Barra superior da loja. Recomendado fundo transparente."
                  value={values.logoUrl}
                  onChange={(logoUrl) => patch({ logoUrl })}
                />
                <StoreImageField
                  id="logo-footer"
                  label="Logotipo (footer)"
                  hint="Rodapé da loja. Pode ser diferente do header (ex.: versão escura)."
                  value={values.footerLogoUrl}
                  onChange={(footerLogoUrl) => patch({ footerLogoUrl })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Contactos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={values.supportEmail}
                    onChange={(e) => patch({ supportEmail: e.target.value })}
                    placeholder="suporte@exemplo.com"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone-primary">Telefone principal</Label>
                    <Input
                      id="phone-primary"
                      value={values.supportPhonePrimary}
                      onChange={(e) => patch({ supportPhonePrimary: e.target.value })}
                      placeholder="+(238) 951 98 91"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-secondary">Telefone secundário</Label>
                    <Input
                      id="phone-secondary"
                      value={values.supportPhoneSecondary}
                      onChange={(e) => patch({ supportPhoneSecondary: e.target.value })}
                      placeholder="+(238) 956 56 97"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nif">NIF</Label>
                  <Input
                    id="nif"
                    value={values.nif}
                    onChange={(e) => patch({ nif: e.target.value })}
                    placeholder="876567890"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Aparece na fatura e no recibo.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Morada</Label>
                  <Textarea
                    id="address"
                    rows={3}
                    value={values.address}
                    onChange={(e) => patch({ address: e.target.value })}
                    placeholder="Linhas de morada no footer"
                    className="resize-y min-h-[72px] text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Imagens SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StoreImageField
                  id="favicon"
                  label="Favicon"
                  hint="Ícone do separador do browser (quadrado, ex. 32×32)."
                  value={values.faviconUrl}
                  onChange={(faviconUrl) => patch({ faviconUrl })}
                  previewClassName="h-8 w-8 object-contain"
                />
                <StoreImageField
                  id="og-image"
                  label="Imagem Open Graph"
                  hint="Preview ao partilhar links (recomendado 1200×630)."
                  value={values.ogImageUrl}
                  onChange={(ogImageUrl) => patch({ ogImageUrl })}
                  previewClassName="h-16 w-auto max-w-[240px] object-cover rounded"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Redes sociais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={values.facebookUrl}
                    onChange={(e) => patch({ facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={values.instagramUrl}
                    onChange={(e) => patch({ instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={values.whatsappNumber}
                    onChange={(e) => patch({ whatsappNumber: e.target.value })}
                    placeholder="+2389519891"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Número com indicativo (só dígitos e +). A loja gera o link wa.me.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-blue-50">
                      <Megaphone className="h-3.5 w-3.5 text-blue-800" aria-hidden />
                    </div>
                    <CardTitle className="text-sm font-semibold">Meta Commerce</CardTitle>
                  </div>
                  <Badge variant={values.metaPixelId.trim() ? "secondary" : "outline"} className="text-[11px]">
                    {values.metaPixelId.trim() ? "Pixel configurado" : "Pixel pendente"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-pixel">Meta Pixel ID</Label>
                  <Input
                    id="meta-pixel"
                    value={values.metaPixelId}
                    onChange={(e) => patch({ metaPixelId: e.target.value })}
                    placeholder="123456789012345"
                    inputMode="numeric"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    ID numérico do pixel no Events Manager. A loja usa este valor para Facebook/Instagram.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-catalog-url">URL do catálogo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="meta-catalog-url"
                      readOnly
                      value={catalogFeedUrl}
                      className="h-9 font-mono text-xs"
                    />
                    <Button type="button" variant="outline" size="icon-sm" onClick={copyCatalogFeedUrl}>
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Copiar URL</span>
                    </Button>
                    <Button type="button" variant="outline" size="icon-sm" asChild>
                      <a href={catalogFeedUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">Abrir catálogo</span>
                      </a>
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Usa esta URL como Data Feed no Commerce Manager e agenda actualização automática.
                  </p>
                </div>

                <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
                    <p>
                      O token da Conversions API continua nas variáveis da API:
                      {" "}
                      <code className="rounded bg-background px-1 py-0.5">META_CONVERSIONS_API_TOKEN</code>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Página de produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProductPageLayoutSection
                  layout={values.productPageLayout}
                  onChange={(productPageLayout) => patch({ productPageLayout })}
                />
                <ProductPageTrustBadgesSection
                  badges={values.productPageTrustBadges}
                  onChange={(productPageTrustBadges) => patch({ productPageTrustBadges })}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Pesquisa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="popular-search">Sugestões populares</Label>
                <Textarea
                  id="popular-search"
                  rows={4}
                  value={values.popularSearchQueriesText}
                  onChange={(e) => patch({ popularSearchQueriesText: e.target.value })}
                  placeholder={"iPhone\nSamsung\nTV"}
                  className="resize-y min-h-[88px] text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Um termo por linha, até 8 sugestões. Aparecem no campo de pesquisa da loja.
                </p>
              </CardContent>
            </Card>

            <Button type="button" onClick={handleSave} disabled={saving || !dirty} className="w-full sm:w-auto lg:col-span-2 lg:justify-self-start">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden /> : null}
              Guardar alterações
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
