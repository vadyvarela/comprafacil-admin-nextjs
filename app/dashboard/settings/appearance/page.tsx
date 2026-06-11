"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { ThemeColorField } from "@/components/settings/theme-color-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GET_STORE_SETTINGS } from "@/lib/graphql/store-settings/queries"
import { UPDATE_STORE_THEME } from "@/lib/graphql/store-settings/mutations"
import type { StoreSettingsGql, StoreThemeMutationData, StoreSettingsQueryData } from "@/lib/graphql/store-settings/types"
import {
  FONT_FAMILY_OPTIONS,
  LAYOUT_MODE_OPTIONS,
  STORE_THEME_PRESETS,
  STORE_VERTICAL_OPTIONS,
  themeTokensFromGql,
  type StoreThemeTokens,
} from "@/lib/store-presets"
import { Loader2, RotateCcw, Sparkles } from "lucide-react"
import { toast } from "sonner"

function rowToTheme(row: StoreSettingsGql): StoreThemeTokens {
  return themeTokensFromGql(row)
}

export default function AppearanceSettingsPage() {
  const { data, loading, error, refetch } = useQuery<StoreSettingsQueryData>(GET_STORE_SETTINGS)
  const [updateTheme, { loading: saving }] = useMutation<StoreThemeMutationData>(UPDATE_STORE_THEME, {
    refetchQueries: [{ query: GET_STORE_SETTINGS }],
  })

  const row = data?.storeSettings
  const serverVersion = row?.updatedAt ?? "__empty__"
  const [draft, setDraft] = useState<{ version: string; values: StoreThemeTokens } | null>(null)
  const serverTheme = row ? rowToTheme(row) : themeTokensFromGql(null)
  const activeDraft = draft?.version === serverVersion ? draft.values : null
  const values = activeDraft ?? serverTheme
  const dirty = activeDraft !== null

  function patch(partial: Partial<StoreThemeTokens>) {
    setDraft((prev) => ({
      version: serverVersion,
      values: { ...((prev?.version === serverVersion ? prev.values : null) ?? serverTheme), ...partial },
    }))
  }

  function applyPreset(vertical: StoreThemeTokens["storeVertical"]) {
    patch(STORE_THEME_PRESETS[vertical])
    toast.message(`Preset "${STORE_VERTICAL_OPTIONS.find((o) => o.value === vertical)?.label}" aplicado`)
  }

  async function handleSave() {
    const hex = /^#[0-9A-Fa-f]{6}$/
    const colorFields: (keyof StoreThemeTokens)[] = [
      "colorBackground",
      "colorSurface",
      "colorPaper",
      "colorForeground",
      "colorMuted",
      "colorInk",
      "colorBorder",
      "colorBorderSubtle",
      "colorPrimary",
      "colorPrimaryDark",
      "colorPrimaryLight",
    ]
    for (const field of colorFields) {
      if (!hex.test(values[field])) {
        toast.error(`Cor inválida em ${field}`)
        return
      }
    }

    try {
      await updateTheme({
        variables: {
          ...values,
          tagline: values.tagline.trim() || null,
        },
      })
      setDraft(null)
      toast.success("Tema guardado")
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
          { label: "Aparência" },
        ]}
      />
      <SettingsSubnav />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <PageHeader
          title="Aparência"
          description="Cores, tipografia e layout da loja pública. Cada loja pode ter o seu próprio tema."
        />

        {error ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">
              Erro ao carregar: {error.message}
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Preset e layout</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Vertical</Label>
                    <Select
                      value={values.storeVertical}
                      onValueChange={(v) => patch({ storeVertical: v as StoreThemeTokens["storeVertical"] })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STORE_VERTICAL_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12px]"
                      onClick={() => applyPreset(values.storeVertical)}
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Aplicar preset
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Layout</Label>
                    <Select
                      value={values.layoutMode}
                      onValueChange={(v) => patch({ layoutMode: v as StoreThemeTokens["layoutMode"] })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LAYOUT_MODE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="tagline">Tagline (título SEO)</Label>
                    <Input
                      id="tagline"
                      value={values.tagline}
                      onChange={(e) => patch({ tagline: e.target.value })}
                      placeholder="Loja de Sapatos e Moda"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Fonte</Label>
                    <Select
                      value={values.fontFamily}
                      onValueChange={(v) => patch({ fontFamily: v as StoreThemeTokens["fontFamily"] })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Fundos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ThemeColorField id="bg" label="Página" value={values.colorBackground} onChange={(v) => patch({ colorBackground: v })} />
                  <ThemeColorField id="surface" label="Cartões" value={values.colorSurface} onChange={(v) => patch({ colorSurface: v })} />
                  <ThemeColorField id="paper" label="Secções" value={values.colorPaper} onChange={(v) => patch({ colorPaper: v })} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Texto</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ThemeColorField id="fg" label="Principal" value={values.colorForeground} onChange={(v) => patch({ colorForeground: v })} />
                  <ThemeColorField id="muted" label="Descrição" hint="Subtítulos e texto secundário" value={values.colorMuted} onChange={(v) => patch({ colorMuted: v })} />
                  <ThemeColorField id="ink" label="Editorial" value={values.colorInk} onChange={(v) => patch({ colorInk: v })} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Bordas</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ThemeColorField id="border" label="Borda" value={values.colorBorder} onChange={(v) => patch({ colorBorder: v })} />
                  <ThemeColorField id="border-subtle" label="Borda suave" value={values.colorBorderSubtle} onChange={(v) => patch({ colorBorderSubtle: v })} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Accent (botões e links)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <ThemeColorField id="primary" label="Primária" value={values.colorPrimary} onChange={(v) => patch({ colorPrimary: v })} />
                  <ThemeColorField id="primary-dark" label="Hover" value={values.colorPrimaryDark} onChange={(v) => patch({ colorPrimaryDark: v })} />
                  <ThemeColorField id="primary-light" label="Clara" value={values.colorPrimaryLight} onChange={(v) => patch({ colorPrimaryLight: v })} />
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handleSave} disabled={saving || !dirty}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden /> : null}
                  Guardar tema
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!dirty}
                  onClick={() => setDraft(null)}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Descartar
                </Button>
              </div>
            </div>

            <Card className="h-fit lg:sticky lg:top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="overflow-hidden rounded-lg border"
                  style={{
                    background: values.colorBackground,
                    borderColor: values.colorBorder,
                    color: values.colorForeground,
                  }}
                >
                  <div
                    className="border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ borderColor: values.colorBorder, background: values.colorPaper }}
                  >
                    Header
                  </div>
                  <div className="space-y-3 p-3">
                    <div
                      className="rounded-md border p-3"
                      style={{ background: values.colorSurface, borderColor: values.colorBorder }}
                    >
                      <p className="text-sm font-semibold" style={{ color: values.colorForeground }}>
                        Título do produto
                      </p>
                      <p className="mt-1 text-xs" style={{ color: values.colorMuted }}>
                        Descrição curta do produto
                      </p>
                      <p className="mt-2 text-sm font-bold" style={{ color: values.colorForeground }}>
                        12 500 CVE
                      </p>
                    </div>
                    <button
                      type="button"
                      className="w-full rounded-md px-3 py-2 text-xs font-semibold text-white"
                      style={{ background: values.colorPrimary }}
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
