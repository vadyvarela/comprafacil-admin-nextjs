"use client"

import { useApolloClient } from "@apollo/client/react"
import { useQuery } from "@apollo/client/react"
import { ChevronDown, ChevronUp, Loader2, Package, Search, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GET_PRODUCT, GET_PRODUCTS } from "@/lib/graphql/products/queries"

type ProductRow = {
  id: string
  title: string
  image?: string | null
  category?: { name: string } | null
}

type DraftRow = { id: string; title: string }

interface CuratedProductPickerProps {
  value: string[]
  max: number
  onChange: (ids: string[]) => void
  orderLabel?: string
  description?: string
}

export function CuratedProductPicker({
  value,
  max,
  onChange,
  orderLabel = "Ordem na home",
  description,
}: CuratedProductPickerProps) {
  const client = useApolloClient()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DraftRow[]>([])
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [titleById, setTitleById] = useState<Record<string, string>>({})

  const valueKey = value.join("\u0001")

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 320)
    return () => clearTimeout(t)
  }, [search])

  const filter = useMemo(
    () => (debounced.length > 0 ? { search: debounced } : null),
    [debounced]
  )

  const { data, loading } = useQuery<{
    products: { data: ProductRow[] }
  }>(GET_PRODUCTS, {
    variables: {
      filter,
      page: { page: 0, size: 28, sortBy: "createdAt", sortDirection: "DESC" },
    },
    skip: !open,
    fetchPolicy: "cache-and-network",
  })

  const rows = data?.products?.data ?? []

  useEffect(() => {
    if (value.length === 0) return
    let cancelled = false
    void (async () => {
      const results = await Promise.all(
        value.map((id) =>
          client.query<{ productDetails: { title: string } }>({
            query: GET_PRODUCT,
            variables: { id },
            fetchPolicy: "cache-first",
          })
        )
      )
      if (cancelled) return
      setTitleById((prev) => {
        const next = { ...prev }
        results.forEach((r: { data?: { productDetails?: { title: string } } }, i: number) => {
          const id = value[i]
          const t = r.data?.productDetails?.title
          if (id && t) next[id] = t
        })
        return next
      })
    })()
    return () => {
      cancelled = true
    }
  }, [valueKey, client, value])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next) {
        setDraft(
          value.map((id) => ({
            id,
            title: titleById[id] ?? "",
          }))
        )
        setSearch("")
        setDebounced("")
      }
    },
    [value, titleById]
  )

  const toggleRow = (p: ProductRow) => {
    setDraft((cur) => {
      const i = cur.findIndex((r) => r.id === p.id)
      if (i >= 0) return cur.filter((_, j) => j !== i)
      if (cur.length >= max) return cur
      return [...cur, { id: p.id, title: p.title }]
    })
  }

  const moveDraft = (index: number, delta: number) => {
    setDraft((arr) => {
      const j = index + delta
      if (j < 0 || j >= arr.length) return arr
      const c = [...arr]
      const t = c[index]!
      c[index] = c[j]!
      c[j] = t
      return c
    })
  }

  const removeAt = (index: number) => {
    setDraft((arr) => arr.filter((_, i) => i !== index))
  }

  const apply = () => {
    const ids = draft.map((r) => r.id)
    setTitleById((prev) => {
      const next = { ...prev }
      for (const r of draft) {
        if (r.title) next[r.id] = r.title
      }
      return next
    })
    onChange(ids)
    setOpen(false)
  }

  const countLabel =
    value.length === 0
      ? "Nenhum produto"
      : value.length === 1
        ? "1 produto"
        : `${value.length} produtos`

  return (
    <div className="space-y-2 sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => handleOpenChange(true)}
        >
          <Package className="h-3.5 w-3.5" />
          Escolher produtos…
        </Button>
        <span className="text-[10px] text-muted-foreground">{countLabel}</span>
      </div>
      {value.length > 0 ? (
        <ol className="flex flex-col gap-1 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-[10px]">
          {value.map((id, idx) => (
            <li key={id} className="flex items-center gap-2 min-w-0">
              <span className="text-muted-foreground shrink-0 w-4">{idx + 1}.</span>
              <span className="truncate font-medium text-foreground">{titleById[id] ?? "…"}</span>
              <span className="font-mono text-muted-foreground shrink-0 opacity-70">{id.slice(0, 8)}…</span>
            </li>
          ))}
        </ol>
      ) : null}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-3 p-4 sm:max-w-2xl" showCloseButton>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">Seleccionar produtos</DialogTitle>
            <DialogDescription className="text-xs">
              {description ??
                `Pesquisa e clica nas linhas para incluir ou remover. ${orderLabel} = ordem na lista à direita (máx. ${max}).`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 min-w-0">
              <Label className="text-[10px]">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-8 pl-8 text-xs"
                  placeholder="Nome ou referência…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[min(52vh,320px)] overflow-y-auto rounded-md border border-border/60">
                {loading && rows.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
                  </div>
                ) : rows.length === 0 ? (
                  <p className="p-3 text-[11px] text-muted-foreground">Sem resultados.</p>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {rows.map((p) => {
                      const selected = draft.some((r) => r.id === p.id)
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => toggleRow(p)}
                            className={`flex w-full items-start gap-2 px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/50 ${
                              selected ? "bg-primary/8" : ""
                            }`}
                          >
                            <span
                              className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded border ${
                                selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                              }`}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 font-medium">{p.title}</span>
                              {p.category?.name ? (
                                <span className="mt-0.5 block text-[10px] text-muted-foreground">{p.category.name}</span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-2 min-w-0 flex flex-col">
              <Label className="text-[10px]">{orderLabel} ({draft.length}/{max})</Label>
              <div className="max-h-[min(52vh,320px)] flex-1 overflow-y-auto rounded-md border border-border/60 bg-muted/15">
                {draft.length === 0 ? (
                  <p className="p-3 text-[11px] text-muted-foreground">Escolhe produtos à esquerda.</p>
                ) : (
                  <ol className="divide-y divide-border/50">
                    {draft.map((row, idx) => (
                      <li key={row.id} className="flex items-center gap-1 px-1.5 py-1">
                        <span className="w-5 shrink-0 text-center text-[10px] text-muted-foreground">{idx + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-xs">{row.title || row.id.slice(0, 8) + "…"}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => moveDraft(idx, -1)}
                          disabled={idx === 0}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => moveDraft(idx, 1)}
                          disabled={idx === draft.length - 1}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground"
                          onClick={() => removeAt(idx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setDraft([])}>
              Limpar lista
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="button" size="sm" className="text-xs" onClick={apply}>
                Aplicar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
