"use client"

import { useMemo } from "react"
import { useQuery } from "@apollo/client/react"
import { ChevronDown, ChevronUp, Plus, Rows3, X } from "lucide-react"
import { HOME_LAYOUT_RULES, type HeaderNavItem } from "@/lib/home-layout/schema"
import { GET_CATEGORY_LIST } from "@/lib/graphql/categories/queries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InternalPathField } from "@/components/store-home/internal-path-field"

type CatRow = { id: string; name: string; slug: string }

function defaultLinkItem(tone?: "promo"): HeaderNavItem {
  return tone === "promo"
    ? { kind: "link", label: "Novo link", href: "/produtos", tone: "promo" }
    : { kind: "link", label: "Novo link", href: "/produtos" }
}

export function StoreHomeHeaderNavPanel({
  items,
  onChange,
}: {
  items: HeaderNavItem[]
  onChange: (next: HeaderNavItem[]) => void
}) {
  const { data, loading } = useQuery<{ categoryList: CatRow[] }>(GET_CATEGORY_LIST, {
    fetchPolicy: "cache-and-network",
  })

  const list = useMemo(() => {
    return [...(data?.categoryList ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "pt", { sensitivity: "base" })
    )
  }, [data?.categoryList])

  const rows = items
  const max = HOME_LAYOUT_RULES.maxHeaderNavItems

  const firstUnusedCategorySlug = useMemo(() => {
    const used = new Set(
      items.filter((r): r is Extract<HeaderNavItem, { kind: "category" }> => r.kind === "category").map((r) => r.slug)
    )
    return list.find((c) => !used.has(c.slug))?.slug ?? list[0]?.slug
  }, [list, items])

  const move = (from: number, delta: number) => {
    const to = from + delta
    if (to < 0 || to >= rows.length) return
    const next = [...rows]
    const t = next[from]!
    next[from] = next[to]!
    next[to] = t
    onChange(next)
  }

  const patchRow = (index: number, patch: HeaderNavItem) => {
    const next = [...rows]
    next[index] = patch
    onChange(next)
  }

  const removeAt = (index: number) => {
    onChange(rows.filter((_, i) => i !== index))
  }

  const addCategory = () => {
    if (rows.length >= max || !firstUnusedCategorySlug) return
    onChange([...rows, { kind: "category", slug: firstUnusedCategorySlug }])
  }

  const addLink = () => {
    if (rows.length >= max) return
    onChange([...rows, defaultLinkItem()])
  }

  const promoTone = (row: HeaderNavItem) => (row.tone === "promo" ? "promo" : "default")

  return (
    <Card className="border-border/60 py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border/50 bg-muted/20 px-4 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Rows3 className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-tight">Menu horizontal (header)</p>
          <p className="text-[10px] leading-snug text-muted-foreground">
            Só aparecem na loja as entradas que adicionares (ordem = menu). «Destaque» = fundo tipo promoções. Máx.{" "}
            {max}.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={rows.length >= max || (!loading && list.length === 0)}
            onClick={addCategory}
          >
            <Plus className="h-3.5 w-3.5" />
            Categoria
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={rows.length >= max}
            onClick={addLink}
          >
            <Plus className="h-3.5 w-3.5" />
            Link
          </Button>
        </div>

        {rows.length ? (
          <ul className="space-y-2">
            {rows.map((row, i) => (
              <li
                key={`${i}-${row.kind}-${row.kind === "category" ? row.slug : row.href}`}
                className="rounded-md border border-border/50 bg-muted/10 p-2"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <div className="min-w-[100px] flex-1 space-y-1">
                    <Label className="text-[10px]">Tipo</Label>
                    <Select
                      value={row.kind}
                      onValueChange={(v) => {
                        const tone = row.tone === "promo" ? ("promo" as const) : undefined
                        if (v === "category") {
                          const slug = row.kind === "category" ? row.slug : firstUnusedCategorySlug
                          if (slug) patchRow(i, tone ? { kind: "category", slug, tone } : { kind: "category", slug })
                          return
                        }
                        patchRow(i, defaultLinkItem(tone))
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="category" className="text-xs">
                          Categoria
                        </SelectItem>
                        <SelectItem value="link" className="text-xs">
                          Link personalizado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[100px] flex-1 space-y-1">
                    <Label className="text-[10px]">Estilo</Label>
                    <Select
                      value={promoTone(row)}
                      onValueChange={(v) => {
                        const tone = v === "promo" ? ("promo" as const) : undefined
                        if (row.kind === "category") {
                          patchRow(i, tone ? { kind: "category", slug: row.slug, tone } : { kind: "category", slug: row.slug })
                        } else {
                          patchRow(i, tone ? { ...row, tone } : { kind: "link", label: row.label, href: row.href })
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default" className="text-xs">
                          Normal
                        </SelectItem>
                        <SelectItem value="promo" className="text-xs">
                          Destaque (promo)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={i === 0}
                      aria-label="Mover para cima"
                      onClick={() => move(i, -1)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={i === rows.length - 1}
                      aria-label="Mover para baixo"
                      onClick={() => move(i, 1)}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label="Remover"
                      onClick={() => removeAt(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {row.kind === "category" ? (
                  <div className="space-y-1">
                    <Label className="text-[10px]">Categoria</Label>
                    <Select
                      value={list.find((c) => c.slug === row.slug)?.id ?? ""}
                      disabled={loading && list.length === 0}
                      onValueChange={(id) => {
                        const cat = list.find((c) => c.id === id)
                        if (!cat) return
                        patchRow(
                          i,
                          row.tone === "promo"
                            ? { kind: "category", slug: cat.slug, tone: "promo" }
                            : { kind: "category", slug: cat.slug }
                        )
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={loading ? "A carregar…" : "Escolher"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {list.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            <span className="truncate">{c.name}</span>
                            <span className="ml-1 font-mono text-[10px] text-muted-foreground">{c.slug}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[10px]">Texto no menu</Label>
                      <Input
                        className="h-8 text-xs"
                        value={row.label}
                        onChange={(e) => patchRow(i, { ...row, label: e.target.value })}
                      />
                    </div>
                    <InternalPathField
                      className="sm:col-span-2"
                      label="Destino (path interno)"
                      value={row.href}
                      allowEmpty={false}
                      placeholder="/ofertas"
                      onChange={(href) => {
                        const h = href?.trim() ? href : "/produtos"
                        patchRow(i, { ...row, href: h })
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            Sem entradas — o menu horizontal na loja fica vazio até adicionares itens.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
