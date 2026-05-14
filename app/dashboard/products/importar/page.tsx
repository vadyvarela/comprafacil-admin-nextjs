"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useQuery } from "@apollo/client/react"
import { Upload, FileJson, Play, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { CREATE_PRODUCT } from "@/lib/graphql/products/mutations"
import { CREATE_PRODUCT_VARIANT } from "@/lib/graphql/variants/mutations"
import { GET_CATEGORY_LIST } from "@/lib/graphql/categories/queries"
import { GET_BRAND_LIST } from "@/lib/graphql/brands/queries"
import { gtwClient } from "@/lib/gtw-client"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/utils/toast"
import {
  parseCatalogSeedJson,
  collectImportIssues,
  isCatalogImportReady,
  resolveProductRefs,
} from "@/lib/catalog-import/parse-catalog-seed"
import { getDefaultCatalogSeedText } from "@/lib/catalog-import/default-seed-text"
import type { CatalogSeedFile, CatalogSeedProduct } from "@/lib/catalog-import/types"
import {
  productOptionCatalogFromVariants,
  seedVariantAttributes,
  variantTitleFromAttributes,
} from "@/lib/catalog-import/variant-metadata"

type LogLine =
  | { kind: "ok"; text: string }
  | { kind: "err"; text: string }

function buildProductMetadata(p: CatalogSeedProduct): string | null {
  const m: Record<string, unknown> = {}
  const rootSku = p.sku?.trim()
  if (rootSku) m.sku = rootSku
  else {
    const first = p.variants[0]?.sku?.trim()
    if (first) m.sku = first
  }
  try {
    const optCatalog = productOptionCatalogFromVariants(p)
    if (optCatalog.length) m.attributes = optCatalog
  } catch {
    /* validação em collectImportIssues */
  }
  return Object.keys(m).length ? JSON.stringify(m) : null
}

export default function ImportCatalogPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [jsonText, setJsonText] = useState("")
  const [parsed, setParsed] = useState<CatalogSeedFile | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [log, setLog] = useState<LogLine[]>([])

  const { data: catData, loading: catLoading } = useQuery<{
    categoryList: { id: string; name: string; slug: string }[]
  }>(GET_CATEGORY_LIST)
  const { data: brandData, loading: brandLoading } = useQuery<{
    brandList: { id: string; name: string; slug: string }[]
  }>(GET_BRAND_LIST)

  const categories = useMemo(() => catData?.categoryList ?? [], [catData])
  const brands = useMemo(() => brandData?.brandList ?? [], [brandData])
  const listsLoading = catLoading || brandLoading

  const issues = useMemo(() => {
    if (!parsed) return []
    return collectImportIssues(parsed, categories, brands, {
      skipEntityResolution: listsLoading,
    })
  }, [parsed, categories, brands, listsLoading])

  const ready = Boolean(parsed) && !listsLoading && isCatalogImportReady(issues) && !parseError

  const validateText = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) {
        setParsed(null)
        setParseError("Cole o JSON do catálogo.")
        return
      }
      const r = parseCatalogSeedJson(trimmed)
      if (!r.ok) {
        setParsed(null)
        setParseError(r.error)
        return
      }
      setParseError(null)
      setParsed(r.data)
    },
    []
  )

  const runImport = async () => {
    if (!parsed || !ready) return
    setImporting(true)
    setLog([])
    const products = parsed.products
    setProgress({ current: 0, total: products.length })
    let ok = 0
    let fail = 0

    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      setProgress({ current: i + 1, total: products.length })
      const { categoryId, brandId } = resolveProductRefs(p, categories, brands)
      if (!categoryId || !brandId) {
        fail++
        setLog((l) => [...l, { kind: "err", text: `✗ ${p.title}: categoria ou marca não resolvida` }])
        continue
      }
      try {
        const discount =
          p.discount != null && Number.isFinite(p.discount)
            ? Math.min(100, Math.max(0, Math.round(p.discount)))
            : null
        const result = await gtwClient.mutate<{
          createProduct: { id: string }
        }>({
          mutation: CREATE_PRODUCT,
          variables: {
            input: {
              title: p.title.trim(),
              summary: p.summary?.trim() || null,
              discount,
              type: { code: "TICKET" },
              metadata: buildProductMetadata(p),
              condition: p.condition,
              categoryId,
              brandId,
              stockData: {
                name: `Stock - ${p.title.trim()}`,
                quantity: 0,
              },
            },
          },
          errorPolicy: "all",
        })
        if (result.error) {
          throw new Error(result.error.message)
        }
        const productId = result.data?.createProduct?.id
        if (!productId) throw new Error("Gateway não devolveu id do produto")

        for (const v of p.variants) {
          const attrs = seedVariantAttributes(p, v)
          const variantMeta: Record<string, unknown> = { attributes: attrs }
          if (v.sku?.trim()) variantMeta.sku = v.sku.trim()
          const variantTitle = v.title?.trim() || variantTitleFromAttributes(attrs)
          const vr = await gtwClient.mutate({
            mutation: CREATE_PRODUCT_VARIANT,
            variables: {
              input: {
                productId,
                title: variantTitle,
                quantity: v.quantity,
                metadata: JSON.stringify(variantMeta),
                priceData: {
                  nickname: "Preço",
                  unitAmount: Math.round(v.price * 100),
                  currency: "CVE",
                },
              },
            },
            errorPolicy: "all",
          })
          if (vr.error) {
            throw new Error(vr.error.message)
          }
        }
        ok++
        setLog((l) => [...l, { kind: "ok", text: `✓ ${p.title} (${p.variants.length} variantes)` }])
      } catch (e: unknown) {
        fail++
        const msg = e instanceof Error ? e.message : String(e)
        setLog((l) => [...l, { kind: "err", text: `✗ ${p.title}: ${msg}` }])
      }
    }

    try {
      await gtwClient.refetchQueries({ include: "active" })
    } catch {
      /* lista de produtos actualiza ao navegar */
    }

    setImporting(false)
    showToast.success(
      "Importação concluída",
      `${ok} produto(s) criados${fail ? `, ${fail} falha(s)` : ""}.`
    )
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const t = String(reader.result ?? "")
      setJsonText(t)
      validateText(t)
    }
    reader.readAsText(file, "UTF-8")
    e.target.value = ""
  }

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Produtos", href: "/dashboard/products" },
          { label: "Importar catálogo" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Importar catálogo (JSON)</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Cada produto com <code className="text-[11px]">variants</code> (preço CVE, stock). Por omissão gera-se{" "}
            <code className="text-[11px]">metadata.attributes</code> na variante com o eixo{" "}
            <code className="text-[11px]">variantOptionTitle</code> (p.ex. «Armazenamento») +{" "}
            <code className="text-[11px]">title</code> em cada variante — necessário para o selector na loja. Opcional:{" "}
            <code className="text-[11px]">attributes</code> por variante para várias dimensões. Categoria e marca por{" "}
            <code className="text-[11px]">slug</code> ou nome (aceita singular/plural e traços; ex.{" "}
            <code className="text-[11px]">smartphone</code> casa com slug <code className="text-[11px]">smartphones</code>
            ).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={listsLoading}
            onClick={() => {
              const t = getDefaultCatalogSeedText()
              setJsonText(t)
              validateText(t)
            }}
          >
            <FileJson className="h-3.5 w-3.5 mr-1.5" />
            Carregar exemplo do repositório
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={listsLoading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Escolher ficheiro…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFile}
          />
          <Button type="button" variant="secondary" size="sm" disabled={!jsonText.trim()} onClick={() => validateText(jsonText)}>
            Validar
          </Button>
        </div>

        {parseError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <span>{parseError}</span>
          </div>
        )}

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
          className="min-h-[280px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          placeholder='{"products":[…]}'
        />

        {parsed && (
          <div className="rounded-lg border border-border/80 bg-card px-3 py-2 text-xs space-y-1">
            {listsLoading ? (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                A carregar categorias e marcas para validar slugs…
              </p>
            ) : null}
            <p className="font-medium text-foreground">
              {parsed.products.length} produto(s) · {issues.length ? `${issues.length} com erros` : "pronto a importar"}
            </p>
            {issues.length > 0 && (
              <ul className="space-y-2 max-h-48 overflow-y-auto text-muted-foreground">
                {issues.slice(0, 40).map((row) => (
                  <li key={row.productIndex}>
                    <span className="font-medium text-foreground">#{row.productIndex + 1} {row.title}</span>
                    <ul className="list-disc pl-4 mt-0.5">
                      {row.messages.map((m, j) => (
                        <li key={`${row.productIndex}-${j}`}>{m}</li>
                      ))}
                    </ul>
                  </li>
                ))}
                {issues.length > 40 ? <li>… mais {issues.length - 40} linhas com erro</li> : null}
              </ul>
            )}
            {issues.length === 0 && <p className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Validação OK</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!ready || importing || listsLoading} onClick={() => void runImport()}>
            {importing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                A importar {progress.current}/{progress.total}…
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Importar
              </>
            )}
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/dashboard/products">Voltar a produtos</Link>
          </Button>
        </div>

        {log.length > 0 && (
          <div className="rounded-md border border-border bg-muted/20 p-3 max-h-56 overflow-y-auto font-mono text-[11px] space-y-0.5">
            {log.map((line, i) => (
              <div key={i} className={line.kind === "err" ? "text-destructive" : "text-foreground"}>
                {line.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
