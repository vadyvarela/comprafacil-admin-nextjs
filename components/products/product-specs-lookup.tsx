"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { showToast } from "@/lib/utils/toast"
import type { ProductSpecifications } from "@/lib/product-specs/types"
import { FormSection } from "@/components/products/product-form-layout"
import { Cpu } from "lucide-react"

type SpecRow = { id: string; key: string; value: string }

type SearchResult = {
  id: number
  name: string
  brand: string
  releaseDate?: string
  matchCertainty?: string
}

function specsToRows(specs: ProductSpecifications): SpecRow[] {
  return Object.entries(specs).map(([key, value], i) => ({
    id: `row-${i}-${key}`,
    key,
    value,
  }))
}

function rowsToSpecs(rows: SpecRow[]): ProductSpecifications {
  const out: ProductSpecifications = {}
  for (const row of rows) {
    const key = row.key.trim()
    const value = row.value.trim()
    if (key && value) out[key] = value
  }
  return out
}

function mergeSpecs(
  existing: ProductSpecifications,
  incoming: ProductSpecifications
): ProductSpecifications {
  return { ...existing, ...incoming }
}

type ProductSpecsSectionProps = {
  value: ProductSpecifications
  onChange: (specs: ProductSpecifications) => void
  titleQuery?: string
  brandName?: string
  disabled?: boolean
}

export function ProductSpecsSection({
  value,
  onChange,
  titleQuery = "",
  brandName,
  disabled = false,
}: ProductSpecsSectionProps) {
  const [rows, setRows] = useState<SpecRow[]>(() => specsToRows(value))

  useEffect(() => {
    setRows(specsToRows(value))
  }, [value])
  const [lookupOpen, setLookupOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(titleQuery)
  const [searching, setSearching] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [previewSpecs, setPreviewSpecs] = useState<ProductSpecifications | null>(null)
  const [previewName, setPreviewName] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)

  const syncRows = useCallback(
    (nextRows: SpecRow[]) => {
      setRows(nextRows)
      onChange(rowsToSpecs(nextRows))
    },
    [onChange]
  )

  const openLookup = () => {
    setSearchQuery(titleQuery.trim())
    setResults([])
    setPreviewSpecs(null)
    setPreviewName("")
    setSearchError(null)
    setLookupOpen(true)
  }

  const runSearch = async () => {
    const q = searchQuery.trim()
    if (!q || searching) return
    setSearching(true)
    setSearchError(null)
    setPreviewSpecs(null)
    setResults([])
    try {
      const params = new URLSearchParams({ q })
      if (brandName?.trim()) params.set("manufacturer", brandName.trim())
      const res = await fetch(`/api/product/specs/search?${params}`)
      const data = (await res.json()) as { results?: SearchResult[]; error?: string }
      if (!res.ok) throw new Error(data.error || "Erro na pesquisa")
      setResults(data.results ?? [])
      if (!data.results?.length) setSearchError("Nenhum dispositivo encontrado.")
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Erro na pesquisa")
    } finally {
      setSearching(false)
    }
  }

  const loadDetail = async (deviceId: number, deviceName: string) => {
    if (loadingDetail) return
    setLoadingDetail(true)
    setSearchError(null)
    try {
      const res = await fetch(`/api/product/specs/detail?id=${deviceId}`)
      const data = (await res.json()) as {
        specifications?: ProductSpecifications
        deviceName?: string
        error?: string
      }
      if (!res.ok) throw new Error(data.error || "Erro ao carregar specs")
      setPreviewSpecs(data.specifications ?? {})
      setPreviewName(data.deviceName || deviceName)
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Erro ao carregar specs")
      setPreviewSpecs(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const applyPreview = (mode: "replace" | "merge") => {
    if (!previewSpecs) return
    const next =
      mode === "merge" ? mergeSpecs(rowsToSpecs(rows), previewSpecs) : previewSpecs
    syncRows(specsToRows(next))
    setLookupOpen(false)
    showToast.success(
      "Especificações aplicadas",
      mode === "merge" ? "Campos existentes foram preservados." : "Especificações substituídas."
    )
  }

  const addRow = () => {
    syncRows([...rows, { id: `row-new-${Date.now()}`, key: "", value: "" }])
  }

  const updateRow = (id: string, field: "key" | "value", text: string) => {
    syncRows(rows.map((r) => (r.id === id ? { ...r, [field]: text } : r)))
  }

  const removeRow = (id: string) => {
    syncRows(rows.filter((r) => r.id !== id))
  }

  const previewRows = useMemo(
    () => (previewSpecs ? specsToRows(previewSpecs) : []),
    [previewSpecs]
  )

  return (
    <>
      <FormSection icon={Cpu} title="Especificações técnicas" iconTone="bg-slate-100 text-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={openLookup}
            disabled={disabled}
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            Buscar especificações
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Pesquisa online gratuita (MobileAPI). Revise antes de guardar.
          </p>
        </div>

        {rows.length > 0 ? (
          <div className="rounded-md border border-border/70 overflow-hidden">
            <div className="grid grid-cols-[1fr_1.2fr_32px] gap-2 px-2.5 py-1.5 bg-muted/30 border-b border-border/60 text-[10px] font-medium uppercase text-muted-foreground">
              <span>Campo</span>
              <span>Valor</span>
              <span />
            </div>
            <div className="divide-y divide-border/50">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_1.2fr_32px] gap-2 px-2.5 py-1.5 items-center"
                >
                  <Input
                    value={row.key}
                    onChange={(e) => updateRow(row.id, "key", e.target.value)}
                    placeholder="Ex: Ecrã"
                    disabled={disabled}
                    className="h-8 text-xs"
                  />
                  <Input
                    value={row.value}
                    onChange={(e) => updateRow(row.id, "value", e.target.value)}
                    placeholder="Ex: 6.7&quot; OLED"
                    disabled={disabled}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                    disabled={disabled}
                    aria-label="Remover linha"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground rounded-md border border-dashed border-border/70 bg-muted/10 px-3 py-2">
            Sem especificações. Use a busca ou adicione linhas manualmente.
          </p>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={addRow}
          disabled={disabled}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar linha
        </Button>
      </FormSection>

      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/80">
            <DialogTitle className="text-base font-semibold">Buscar especificações</DialogTitle>
            <DialogDescription className="text-xs">
              Pesquise o modelo e escolha o dispositivo correto na lista.
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 py-3 space-y-3">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: iPhone 16 Pro"
                className="h-9 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void runSearch()
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                className="h-9 shrink-0"
                onClick={() => void runSearch()}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pesquisar"}
              </Button>
            </div>

            {searchError ? (
              <p className="text-xs text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                {searchError}
              </p>
            ) : null}

            {results.length > 0 && !previewSpecs ? (
              <div className="rounded-md border border-border/70 divide-y divide-border/50 max-h-48 overflow-y-auto">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/40 transition-colors"
                    onClick={() => void loadDetail(item.id, item.name)}
                    disabled={loadingDetail}
                  >
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {[item.brand, item.releaseDate, item.matchCertainty]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}

            {loadingDetail ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                A carregar especificações…
              </div>
            ) : null}

            {previewSpecs ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-foreground">{previewName}</p>
                    <p className="text-[11px] text-muted-foreground">Pré-visualização</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setPreviewSpecs(null)
                      setPreviewName("")
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="rounded-md border border-border/70 max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {previewRows.map((row) => (
                        <tr key={row.id} className="border-b border-border/40 last:border-0">
                          <td className="px-3 py-2 font-medium text-muted-foreground w-[38%] align-top">
                            {row.key}
                          </td>
                          <td className="px-3 py-2 text-foreground">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 px-4 py-3 border-t border-border/80 bg-muted/10">
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setLookupOpen(false)}>
              Cancelar
            </Button>
            {previewSpecs ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8"
                  onClick={() => applyPreview("merge")}
                >
                  Mesclar
                </Button>
                <Button type="button" size="sm" className="h-8" onClick={() => applyPreview("replace")}>
                  Aplicar
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
