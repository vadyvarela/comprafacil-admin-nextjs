"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQuery } from "@apollo/client/react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Images,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/admin/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/lib/utils/toast"
import { cn } from "@/lib/utils"
import { GET_BRAND_LIST } from "@/lib/graphql/brands/queries"
import {
  MEDIA_GROUP_NO_BRAND,
  mediaGroupFromBrandSlug,
  mediaGroupLabel,
} from "@/lib/media/brand-group"

const PAGE_SIZE = 48
const GROUP_ALL = "__all__"

type MediaRow = {
  id: string
  url: string
  imageUrl?: string
  originalFilename?: string | null
  groupSlug?: string | null
}

type ListPayload = {
  status?: boolean
  data?: MediaRow[]
  pagination?: {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }
  error?: string
}

function mediaUrl(row: MediaRow): string {
  return row.url || row.imageUrl || ""
}

function extractError(body: ListPayload & Record<string, unknown>): string {
  const d = body?.data as Record<string, unknown> | undefined
  if (d && typeof d.uiMessage === "string" && d.uiMessage) return d.uiMessage
  if (typeof body?.error === "string") return body.error
  return "Erro ao carregar biblioteca"
}

export type MediaPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Multi-select for gallery; single for variants. Default: multi. */
  multiple?: boolean
  maxSelectable?: number
  /** Prefill group filter from product brand. */
  brandSlug?: string | null
  /** Override initial folder (`__all__` = todas). */
  initialGroup?: string
  /** URLs already in use — shown as selected / skipped where useful. */
  excludeUrls?: string[]
  onSelect: (urls: string[]) => void
  title?: string
  description?: string
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  multiple = true,
  maxSelectable = 12,
  brandSlug,
  initialGroup,
  excludeUrls = [],
  onSelect,
  title = "Escolher da biblioteca",
  description = "Selecciona imagens já existentes na biblioteca de media.",
}: MediaPickerDialogProps) {
  const defaultGroup =
    initialGroup || (brandSlug ? mediaGroupFromBrandSlug(brandSlug) : GROUP_ALL)
  const [page, setPage] = useState(0)
  const [groupFilter, setGroupFilter] = useState(defaultGroup || GROUP_ALL)
  const [groupOptions, setGroupOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<MediaRow[]>([])
  const [pagination, setPagination] = useState<ListPayload["pagination"]>()
  const [selected, setSelected] = useState<string[]>([])

  const excludeSet = useMemo(
    () => new Set(excludeUrls.filter(Boolean)),
    [excludeUrls],
  )

  const { data: brandsData } = useQuery<{
    brandList: { id: string; name: string; slug: string }[]
  }>(GET_BRAND_LIST, { skip: !open })

  const brands = useMemo(() => brandsData?.brandList ?? [], [brandsData])
  const brandNameBySlug = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of brands) {
      if (b.slug) map.set(b.slug.toLowerCase(), b.name)
    }
    return map
  }, [brands])

  const filterGroupOptions = useMemo(() => {
    const set = new Set<string>(groupOptions)
    set.add(MEDIA_GROUP_NO_BRAND)
    for (const b of brands) {
      if (b.slug) set.add(b.slug.toLowerCase())
    }
    return Array.from(set).sort((a, b) =>
      mediaGroupLabel(a, brandNameBySlug).localeCompare(
        mediaGroupLabel(b, brandNameBySlug),
        "pt",
      ),
    )
  }, [groupOptions, brands, brandNameBySlug])

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/media/groups", { method: "GET" })
      const body = (await res.json()) as { status?: boolean; data?: unknown }
      if (!res.ok || body.status === false) return
      const raw = body.data
      if (!Array.isArray(raw)) return
      setGroupOptions(
        raw
          .filter((g): g is string => typeof g === "string" && g.length > 0)
          .sort((a, b) => a.localeCompare(b)),
      )
    } catch {
      /* ignore */
    }
  }, [])

  const fetchList = useCallback(
    async (pageNum: number, group: string) => {
      setLoading(true)
      try {
        const qs = new URLSearchParams({
          page: String(pageNum),
          size: String(PAGE_SIZE),
        })
        if (group && group !== GROUP_ALL) qs.set("group", group)
        const res = await fetch(`/api/media?${qs.toString()}`, { method: "GET" })
        const body = (await res.json()) as ListPayload & Record<string, unknown>
        if (!res.ok || body.status === false) {
          throw new Error(extractError(body))
        }
        setItems(Array.isArray(body.data) ? body.data : [])
        setPagination(body.pagination)
      } catch (e) {
        showToast.error(
          "Biblioteca",
          e instanceof Error ? e.message : "Erro ao carregar",
        )
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!open) return
    setPage(0)
    setSelected([])
    setGroupFilter(defaultGroup || GROUP_ALL)
    void fetchGroups()
  }, [open, defaultGroup, fetchGroups])

  useEffect(() => {
    if (!open) return
    void fetchList(page, groupFilter)
  }, [open, page, groupFilter, fetchList])

  const toggle = (url: string) => {
    if (!url || excludeSet.has(url)) return
    if (!multiple) {
      setSelected([url])
      return
    }
    setSelected((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url)
      const remaining = maxSelectable - excludeSet.size
      if (prev.length >= remaining) {
        showToast.error(
          "Limite",
          `Podes seleccionar no máximo ${remaining} imagem(ns)`,
        )
        return prev
      }
      return [...prev, url]
    })
  }

  const handleConfirm = () => {
    if (selected.length === 0) return
    onSelect(selected)
    onOpenChange(false)
  }

  const pageCount = pagination?.pageCount ?? 1
  const total = pagination?.total ?? items.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border/70 px-4 py-3 sm:px-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Images className="h-4 w-4 text-muted-foreground" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-3 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={groupFilter || GROUP_ALL}
            onValueChange={(v) => {
              setGroupFilter(v)
              setPage(0)
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs sm:w-[220px]">
              <SelectValue placeholder="Pasta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GROUP_ALL}>Todas as pastas</SelectItem>
              {filterGroupOptions.map((g) => (
                <SelectItem key={g} value={g}>
                  {mediaGroupLabel(g, brandNameBySlug)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground sm:ml-auto">
            {selected.length > 0
              ? `${selected.length} seleccionada${selected.length > 1 ? "s" : ""}`
              : `${total} imagem${total === 1 ? "" : "ns"}`}
          </span>
        </div>

        <div className="min-h-[280px] overflow-y-auto rounded-md border border-border/70 bg-muted/15 p-2 sm:max-h-[420px]">
          {loading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Images}
              title="Nenhuma imagem nesta pasta"
              description="Faz upload no PC ou em Biblioteca de media."
              className="min-h-[260px] py-8"
            />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {items.map((row) => {
                const url = mediaUrl(row)
                if (!url) return null
                const alreadyUsed = excludeSet.has(url)
                const isSelected = selected.includes(url)
                return (
                  <button
                    key={row.id}
                    type="button"
                    disabled={alreadyUsed}
                    onClick={() => toggle(url)}
                    title={
                      alreadyUsed
                        ? "Já está na galeria"
                        : row.originalFilename || url
                    }
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-md border bg-background shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      alreadyUsed && "opacity-40 cursor-not-allowed",
                      isSelected
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border/70 hover:border-primary/50",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={row.originalFilename || "Media"}
                      className="h-full w-full object-contain p-1"
                      loading="lazy"
                    />
                    {isSelected && (
                      <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                    {alreadyUsed && (
                      <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                        Em uso
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={loading || page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {page + 1} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={loading || page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        </div>

        <DialogFooter className="border-t border-border/70 bg-muted/20 px-4 py-3 sm:gap-2 sm:px-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs"
            disabled={selected.length === 0 || loading}
            onClick={handleConfirm}
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            {multiple
              ? `Adicionar${selected.length ? ` (${selected.length})` : ""}`
              : "Usar imagem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
