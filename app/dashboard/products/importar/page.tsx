"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useQuery } from "@apollo/client/react"
import { Upload, Play, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { CREATE_PRODUCT, UPDATE_PRODUCT } from "@/lib/graphql/products/mutations"
import { CREATE_CATEGORY } from "@/lib/graphql/categories/mutations"
import { CREATE_BRAND } from "@/lib/graphql/brands/mutations"
import { CREATE_PRODUCT_VARIANT } from "@/lib/graphql/variants/mutations"
import {
  combineMutationErrors,
  findExistingProductIdByExactTitle,
  isDuplicateProductTitleMessage,
  syncExistingProductFromCatalog,
} from "@/lib/catalog-import/reconcile-import-product"
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
import type { CatalogSeedFile, CatalogSeedProduct, CatalogSeedVariant } from "@/lib/catalog-import/types"
import {
  productOptionCatalogFromVariants,
  seedVariantAttributes,
  variantTitleFromAttributes,
} from "@/lib/catalog-import/variant-metadata"

type LogLine =
  | { kind: "ok"; text: string }
  | { kind: "err"; text: string }

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Mutations em série podem receber 429 do proxy; espera e repete. */
async function with429Retry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      const msg = e instanceof Error ? e.message : String(e)
      if (!/429|too many|rate limit/i.test(msg)) throw e
      const backoff = Math.min(2000 + attempt * 1500, 20_000)
      await sleep(backoff)
    }
  }
  if (last instanceof Error) throw last
  throw new Error(`${label}: limite de pedidos (429) após várias tentativas`)
}

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
  const images = productImages(p)
  if (images.length) m.images = images
  return Object.keys(m).length ? JSON.stringify(m) : null
}

/** Imagens de uma variante, pela ordem do ficheiro, sem repetições. */
function variantImages(v: CatalogSeedVariant): string[] {
  const all = [v.image, ...(v.images ?? [])]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url))
  return [...new Set(all)]
}

/** Galeria do produto: as imagens de todas as variantes, até 8. */
function productImages(p: CatalogSeedProduct): string[] {
  return [...new Set(p.variants.flatMap(variantImages))].slice(0, 8)
}

export default function ImportCatalogPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [jsonText, setJsonText] = useState("")
  const [parsed, setParsed] = useState<CatalogSeedFile | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [log, setLog] = useState<LogLine[]>([])
  // Publicar ao importar: novos nascem publicados; os que já existem (mesmo título) passam a publicados.
  const [publish, setPublish] = useState(true)

  const { data: catData, loading: catLoading } = useQuery<{
    categoryList: { id: string; name: string; slug: string }[]
  }>(GET_CATEGORY_LIST)
  const { data: brandData, loading: brandLoading } = useQuery<{
    brandList: { id: string; name: string; slug: string }[]
  }>(GET_BRAND_LIST)

  const categories = useMemo(() => catData?.categoryList ?? [], [catData])
  const brands = useMemo(() => brandData?.brandList ?? [], [brandData])
  const listsLoading = catLoading || brandLoading

  // As categorias e marcas do ficheiro que ainda não existem contam como
  // existentes para validar: são criadas antes dos produtos.
  const toCreate = useMemo(
    () => ({
      categories: missingBySlug(categories, parsed?.categories),
      brands: missingBySlug(brands, parsed?.brands),
    }),
    [categories, brands, parsed]
  )
  const plannedCategories = useMemo(() => withPlanned(categories, toCreate.categories), [categories, toCreate])
  const plannedBrands = useMemo(() => withPlanned(brands, toCreate.brands), [brands, toCreate])

  const issues = useMemo(() => {
    if (!parsed) return []
    return collectImportIssues(parsed, plannedCategories, plannedBrands, {
      skipEntityResolution: listsLoading,
    })
  }, [parsed, plannedCategories, plannedBrands, listsLoading])

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
    let synced = 0
    let fail = 0

    // Listas locais: recebem o que for criado aqui, para os produtos já as encontrarem.
    const cats = [...categories]
    const brs = [...brands]
    try {
      for (const seed of toCreate.brands) {
        const res = await with429Retry(`createBrand: ${seed.name}`, () =>
          gtwClient.mutate<{ createBrand: { id: string; name: string; slug: string } }>({
            mutation: CREATE_BRAND,
            variables: { input: { name: seed.name.trim(), slug: seed.slug.trim(), status: { code: "ACTIVE" } } },
            errorPolicy: "all",
          })
        )
        const created = res.data?.createBrand
        if (!created) throw new Error(`marca «${seed.name}»: ${combineMutationErrors(res) || "sem resposta"}`)
        brs.push(created)
        setLog((l) => [...l, { kind: "ok", text: `+ marca ${created.name}` }])
        await sleep(120)
      }
      for (const [i, seed] of toCreate.categories.entries()) {
        const parentSlug = seed.parentSlug?.trim()
        const parent = parentSlug ? cats.find((c) => c.slug === parentSlug) : null
        if (parentSlug && !parent) {
          throw new Error(`categoria «${seed.name}»: mãe «${parentSlug}» não existe nem vem antes no ficheiro`)
        }
        const res = await with429Retry(`createCategory: ${seed.name}`, () =>
          gtwClient.mutate<{ createCategory: { id: string; name: string; slug: string } }>({
            mutation: CREATE_CATEGORY,
            variables: {
              input: {
                name: seed.name.trim(),
                slug: seed.slug.trim(),
                image: seed.image?.trim() || null,
                showOnHome: seed.showOnHome ?? true,
                orderIndex: seed.orderIndex ?? i,
                parentCategoryId: parent?.id ?? null,
                status: { code: "ACTIVE" },
              },
            },
            errorPolicy: "all",
          })
        )
        const created = res.data?.createCategory
        if (!created) throw new Error(`categoria «${seed.name}»: ${combineMutationErrors(res) || "sem resposta"}`)
        cats.push(created)
        setLog((l) => [...l, { kind: "ok", text: `+ categoria ${created.name}` }])
        await sleep(120)
      }
    } catch (e: unknown) {
      // Sem categorias ou marcas, os produtos falhariam todos: pára aqui.
      const msg = e instanceof Error ? e.message : String(e)
      setLog((l) => [...l, { kind: "err", text: `✗ ${msg}. Nenhum produto foi importado.` }])
      setImporting(false)
      return
    }

    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      setProgress({ current: i + 1, total: products.length })

      const preflight = collectImportIssues(
        { meta: parsed.meta, products: [p] },
        cats,
        brs,
        { skipEntityResolution: false }
      )
      if (preflight.length > 0) {
        fail++
        const detail = preflight.flatMap((row) => row.messages).join("; ")
        setLog((l) => [...l, { kind: "err", text: `✗ ${p.title}: ${detail}` }])
        continue
      }

      const { categoryId, brandId } = resolveProductRefs(p, cats, brs)
      if (!categoryId || !brandId) {
        fail++
        setLog((l) => [...l, { kind: "err", text: `✗ ${p.title}: categoria ou marca não resolvida (interno)` }])
        continue
      }

      try {
        const discount =
          p.discount != null && Number.isFinite(p.discount)
            ? Math.min(100, Math.max(0, Math.round(p.discount)))
            : null
        const result = await with429Retry(`createProduct: ${p.title}`, () =>
          gtwClient.mutate<{
            createProduct: { id: string }
          }>({
            mutation: CREATE_PRODUCT,
            variables: {
              input: {
                title: p.title.trim(),
                summary: p.summary?.trim() || null,
                discount,
                type: { code: "TICKET" },
                // Sem estado, a API cria em rascunho.
                ...(publish ? { status: { code: "ACTIVE" } } : {}),
                // Antes as imagens do ficheiro eram ignoradas e o produto nascia sem foto.
                image: productImages(p)[0] ?? null,
                metadata: buildProductMetadata(p),
                condition: p.condition,
                categoryId,
                brandId,
                stockData: {
                  name: `Stock - ${p.title.trim()}`,
                  quantity: p.variants.reduce(
                    (sum, vv) => sum + Math.max(0, Math.floor(Number(vv.quantity)) || 0),
                    0
                  ),
                },
              },
            },
            errorPolicy: "all",
          })
        )
        await sleep(120)
        const errMsg = combineMutationErrors(result)
        const createdId = result.data?.createProduct?.id

        if (!createdId) {
          if (isDuplicateProductTitleMessage(errMsg)) {
            const existingId = await with429Retry(`findProduct:${p.title}`, () =>
              findExistingProductIdByExactTitle(gtwClient, p.title.trim())
            )
            if (!existingId) {
              throw new Error(
                errMsg || "Produto com este título já existe, mas não foi encontrado na pesquisa."
              )
            }
            const sync = await with429Retry(`syncProduct:${p.title}`, () =>
              syncExistingProductFromCatalog(gtwClient, existingId, p)
            )
            await sleep(120)
            if (publish) {
              // A API só altera os campos enviados: título igual, estado publicado.
              const pub = await with429Retry(`publishProduct:${p.title}`, () =>
                gtwClient.mutate({
                  mutation: UPDATE_PRODUCT,
                  variables: {
                    id: existingId,
                    input: { title: p.title.trim(), type: { code: "TICKET" }, status: { code: "ACTIVE" } },
                  },
                  errorPolicy: "all",
                })
              )
              const pubErr = combineMutationErrors(pub)
              if (pubErr) sync.warnings.push(`não publicado: ${pubErr}`)
              await sleep(120)
            }
            synced++
            const w = sync.warnings.length ? ` — ${sync.warnings.join("; ")}` : ""
            setLog((l) => [
              ...l,
              {
                kind: "ok",
                text: `↻ ${p.title}: ${sync.updated} variante(s) stock/preço actualizado(s)${
                  sync.created ? `, ${sync.created} nova(s)` : ""
                }${w}`,
              },
            ])
            continue
          }
          throw new Error(errMsg || "Gateway não devolveu id do produto")
        }

        const productId = createdId

        for (const v of p.variants) {
          const attrs = seedVariantAttributes(p, v)
          const variantMeta: Record<string, unknown> = { attributes: attrs }
          if (v.sku?.trim()) variantMeta.sku = v.sku.trim()
          const vImages = variantImages(v)
          if (vImages.length) variantMeta.images = vImages
          const variantTitle = v.title?.trim() || variantTitleFromAttributes(attrs)
          const vr = await with429Retry(`variant: ${p.title}`, () =>
            gtwClient.mutate({
              mutation: CREATE_PRODUCT_VARIANT,
              variables: {
                input: {
                  productId,
                  title: variantTitle,
                  quantity: v.quantity,
                  image: vImages[0] ?? null,
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
          )
          await sleep(120)
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
      await sleep(80)
    }

    try {
      await gtwClient.refetchQueries({ include: "active" })
    } catch {
      /* lista de produtos actualiza ao navegar */
    }

    setImporting(false)
    showToast.success(
      "Importação concluída",
      [
        ok ? `${ok} novo(s)` : null,
        synced ? `${synced} existente(s) actualizado(s) (stock)` : null,
        fail ? `${fail} falha(s)` : null,
      ]
        .filter(Boolean)
        .join(" · ")
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
            Cada produto com <code className="text-xs">variants</code> (preço CVE, stock). Se o título já existir no
            gateway, a importação <strong>actualiza stock e preço</strong> das variantes (casamento por SKU ou título) em
            vez de falhar. Por omissão gera-se{" "}
            <code className="text-xs">metadata.attributes</code> na variante com o eixo{" "}
            <code className="text-xs">variantOptionTitle</code> (p.ex. «Armazenamento») +{" "}
            <code className="text-xs">title</code> em cada variante — necessário para o selector na loja. Opcional:{" "}
            <code className="text-xs">attributes</code> por variante para várias dimensões. Categoria e marca por{" "}
            <code className="text-xs">slug</code> ou nome (aceita singular/plural e traços; ex.{" "}
            <code className="text-xs">smartphone</code> casa com slug <code className="text-xs">smartphones</code>
            ).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
          className="min-h-[280px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          placeholder='{"products":[…]}'
        />

        {parsed && (
          <div className="rounded-lg border border-border/80 bg-card px-3 py-2 text-xs space-y-1 shadow-xs">
            {listsLoading ? (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                A carregar categorias e marcas para validar slugs…
              </p>
            ) : null}
            <p className="font-medium text-foreground">
              {parsed.products.length} produto(s) · {issues.length ? `${issues.length} com erros` : "pronto a importar"}
            </p>
            {!listsLoading && (toCreate.categories.length > 0 || toCreate.brands.length > 0) ? (
              <p className="text-muted-foreground">
                Antes dos produtos, cria nesta loja: {toCreate.categories.length} categoria(s)
                {toCreate.brands.length > 0 ? ` e ${toCreate.brands.length} marca(s)` : ""}. As que já existem (mesmo slug) ficam como estão.
              </p>
            ) : null}
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
            {issues.length === 0 && <p className="text-success-strong flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Validação OK</p>}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
            disabled={importing}
            className="size-4 accent-primary"
          />
          Publicar logo na loja
          <span className="text-xs text-muted-foreground">
            (os produtos que já existem com o mesmo título também passam a publicados)
          </span>
        </label>

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
          <div className="rounded-md border border-border bg-muted/20 p-3 max-h-56 overflow-y-auto font-mono text-xs space-y-0.5">
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

type Entity = { id: string; name: string; slug: string }

/** Entradas do ficheiro cujo slug ainda não existe na loja activa. */
function missingBySlug<T extends { slug: string }>(existing: Entity[], seeds: T[] | undefined): T[] {
  const have = new Set(existing.map((e) => e.slug.trim().toLowerCase()))
  return (seeds ?? []).filter((s) => !have.has(s.slug.trim().toLowerCase()))
}

/** A lista existente mais as entradas a criar, com um id provisório só para validação. */
function withPlanned(existing: Entity[], planned: { name: string; slug: string }[]): Entity[] {
  return [...existing, ...planned.map((p) => ({ id: `novo:${p.slug}`, name: p.name, slug: p.slug }))]
}
