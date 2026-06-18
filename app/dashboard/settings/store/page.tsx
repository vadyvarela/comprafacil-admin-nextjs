"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { StoreImageField } from "@/components/settings/store-image-field"
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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type StoreDraft = {
  siteName: string
  siteDescription: string
  logoUrl: string
  faviconUrl: string
  ogImageUrl: string
  supportEmail: string
  supportPhonePrimary: string
  supportPhoneSecondary: string
  address: string
  facebookUrl: string
  instagramUrl: string
  whatsappNumber: string
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
    faviconUrl: row.faviconUrl?.trim() ?? "",
    ogImageUrl: row.ogImageUrl?.trim() ?? "",
    supportEmail: row.supportEmail?.trim() ?? "",
    supportPhonePrimary: row.supportPhonePrimary?.trim() ?? "",
    supportPhoneSecondary: row.supportPhoneSecondary?.trim() ?? "",
    address: row.address?.trim() ?? "",
    facebookUrl: row.facebookUrl?.trim() ?? "",
    instagramUrl: row.instagramUrl?.trim() ?? "",
    whatsappNumber: row.whatsappNumber?.trim() ?? "",
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
          faviconUrl: values.faviconUrl.trim() || null,
          ogImageUrl: values.ogImageUrl.trim() || null,
          supportEmail: values.supportEmail.trim() || null,
          supportPhonePrimary: values.supportPhonePrimary.trim() || null,
          supportPhoneSecondary: values.supportPhoneSecondary.trim() || null,
          address: values.address.trim() || null,
          facebookUrl: values.facebookUrl.trim() || null,
          instagramUrl: values.instagramUrl.trim() || null,
          whatsappNumber: values.whatsappNumber.trim() || null,
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
          <div className="grid gap-4 max-w-2xl">
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
                  id="logo"
                  label="Logotipo"
                  hint="Header e páginas da loja. Recomendado fundo transparente."
                  value={values.logoUrl}
                  onChange={(logoUrl) => patch({ logoUrl })}
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

            <Card>
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

            <Card>
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

            <Button type="button" onClick={handleSave} disabled={saving || !dirty} className="w-full sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden /> : null}
              Guardar alterações
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
