"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@apollo/client/react"
import {
  Copy,
  Images,
  LayoutGrid,
  List,
  Loader2,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Link2,
  CheckSquare,
  Square,
  X,
} from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DataPanel, DataPanelContent } from "@/components/admin/data-panel"
import { EmptyState } from "@/components/admin/empty-state"
import { FormField } from "@/components/admin/form-field"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { showToast } from "@/lib/utils/toast"
import { cn } from "@/lib/utils"
import { GET_BRAND_LIST } from "@/lib/graphql/brands/queries"
import {
  MEDIA_GROUP_NO_BRAND,
  mediaGroupLabel,
} from "@/lib/media/brand-group"

const GROUP_FILTER_NONE = "__none__"
const PAGE_SIZE = 200
const VIEW_MODE_KEY = "media-library-view"
const UPLOAD_CUSTOM = "__custom__"

type ViewMode = "grid" | "list"

type MediaRow = {
  id: string
  url: string
  imageUrl?: string
  originalFilename?: string | null
  contentType?: string | null
  byteSize?: number | null
  createdAt?: string
  groupSlug?: string | null
  source?: string | null
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
}

function formatBytes(n: number | null | undefined): string {
  if (n == null || n <= 0) return "—"
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function extractError(body: Record<string, unknown>): string {
  const d = body?.data as Record<string, unknown> | undefined
  if (d && typeof d.uiMessage === "string" && d.uiMessage) return d.uiMessage
  if (d && typeof d.technicalMessage === "string" && d.technicalMessage) return d.technicalMessage
  if (typeof body?.error === "string") return body.error
  return "Pedido falhou"
}

function readViewMode(): ViewMode {
  if (typeof window === "undefined") return "grid"
  const stored = window.localStorage.getItem(VIEW_MODE_KEY)
  return stored === "list" ? "list" : "grid"
}

const gridMedia =
  "grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12"

function SelectionCheckbox({
  checked,
  indeterminate,
  onChange,
  className,
  interactive = true,
  ariaLabel = "Alternar seleção",
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  className?: string
  interactive?: boolean
  ariaLabel?: string
}) {
  const interactiveProps = interactive
    ? {
        role: "checkbox" as const,
        "aria-checked": indeterminate ? ("mixed" as const) : checked,
        "aria-label": ariaLabel,
        tabIndex: 0,
        onClick: (e: React.MouseEvent<HTMLSpanElement>) => {
          e.stopPropagation()
          onChange()
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLSpanElement>) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            e.stopPropagation()
            onChange()
          }
        },
      }
    : {
        "aria-hidden": true,
      }

  return (
    <span
      {...interactiveProps}
      className={cn(
        "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
        checked || indeterminate
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/80 bg-background/90 text-transparent hover:border-primary/50",
        className
      )}
    >
      {indeterminate ? (
        <span className="h-0.5 w-2.5 rounded-full bg-current" />
      ) : checked ? (
        <CheckSquare className="h-3.5 w-3.5" strokeWidth={2.5} />
      ) : (
        <Square className="h-3.5 w-3.5 opacity-25 sm:opacity-0 sm:group-hover/check:opacity-30 sm:group-focus-within/check:opacity-30" />
      )}
    </span>
  )
}

export default function MediaLibraryPage() {
  const [page, setPage] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [groupFilter, setGroupFilter] = useState("")
  const [uploadGroup, setUploadGroup] = useState(MEDIA_GROUP_NO_BRAND)
  const [uploadCustomGroup, setUploadCustomGroup] = useState("")
  const [groupOptions, setGroupOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<MediaRow[]>([])
  const [pagination, setPagination] = useState<ListPayload["pagination"]>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTargets, setDeleteTargets] = useState<MediaRow[]>([])
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: brandsData } = useQuery<{
    brandList: { id: string; name: string; slug: string }[]
  }>(GET_BRAND_LIST)

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
        "pt"
      )
    )
  }, [groupOptions, brands, brandNameBySlug])

  const resolvedUploadGroup = useMemo(() => {
    if (uploadGroup === UPLOAD_CUSTOM) {
      return uploadCustomGroup.trim()
    }
    return uploadGroup.trim()
  }, [uploadGroup, uploadCustomGroup])

  useEffect(() => {
    setViewMode(readViewMode())
  }, [])

  const setView = (mode: ViewMode) => {
    setViewMode(mode)
    window.localStorage.setItem(VIEW_MODE_KEY, mode)
  }

  const labelFor = useCallback(
    (slug: string) => mediaGroupLabel(slug, brandNameBySlug),
    [brandNameBySlug]
  )

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/media/groups", { method: "GET" })
      const body = (await res.json()) as { status?: boolean; data?: unknown }
      if (!res.ok || body.status === false) return
      const raw = body.data
      if (!Array.isArray(raw)) return
      setGroupOptions(
        raw.filter((g): g is string => typeof g === "string" && g.length > 0).sort((a, b) => a.localeCompare(b))
      )
    } catch {
      /* ignore */
    }
  }, [])

  const fetchList = useCallback(
    async (pageNum: number) => {
      setLoading(true)
      try {
        const qs = new URLSearchParams({ page: String(pageNum), size: String(PAGE_SIZE) })
        if (groupFilter) qs.set("group", groupFilter)
        const res = await fetch(`/api/media?${qs.toString()}`, { method: "GET" })
        const body = (await res.json()) as ListPayload & Record<string, unknown>
        if (!res.ok) {
          throw new Error(extractError(body))
        }
        if (body.status === false) {
          throw new Error(extractError(body))
        }
        setItems(Array.isArray(body.data) ? body.data : [])
        setPagination(body.pagination)
        setSelectedIds(new Set())
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao carregar"
        showToast.error("Biblioteca", msg)
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [groupFilter]
  )

  useEffect(() => {
    void fetchGroups()
  }, [fetchGroups])

  useEffect(() => {
    setPage(0)
  }, [groupFilter])

  useEffect(() => {
    void fetchList(page)
  }, [page, fetchList])

  const pageIds = useMemo(() => items.map((row) => row.id), [items])
  const selectedOnPage = useMemo(
    () => pageIds.filter((id) => selectedIds.has(id)).length,
    [pageIds, selectedIds]
  )
  const allOnPageSelected = items.length > 0 && selectedOnPage === items.length
  const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const openDeleteDialog = (rows: MediaRow[]) => {
    if (rows.length === 0) return
    setDeleteTargets(rows)
    setDeleteOpen(true)
  }

  const openDeleteSelected = () => {
    const rows = items.filter((row) => selectedIds.has(row.id))
    openDeleteDialog(rows)
  }

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast.error("Formato", "Seleccione uma imagem")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("Tamanho", "Máximo 10 MB")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      if (resolvedUploadGroup) fd.append("group", resolvedUploadGroup)
      fd.append("source", "LIBRARY")
      const res = await fetch("/api/media", { method: "POST", body: fd })
      const body = (await res.json()) as Record<string, unknown>
      if (!res.ok) {
        throw new Error(extractError(body))
      }
      const data = body.data as Record<string, unknown> | undefined
      if (body.status === false || !data?.url) {
        throw new Error(extractError(body))
      }
      showToast.success("Upload", "Imagem adicionada à biblioteca")
      void fetchGroups()
      if (page !== 0) setPage(0)
      else await fetchList(0)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro no upload"
      showToast.error("Upload", msg)
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) void uploadFile(f)
  }

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showToast.success("Copiado", "URL no clipboard")
    } catch {
      showToast.error("Clipboard", "Não foi possível copiar")
    }
  }

  const confirmDelete = async () => {
    if (deleteTargets.length === 0) return
    setDeleting(true)
    const ids = deleteTargets.map((row) => row.id)
    let ok = 0
    let fail = 0
    const chunkSize = 6
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize)
      const results = await Promise.allSettled(
        chunk.map(async (id) => {
          const res = await fetch(`/api/media/${id}`, { method: "DELETE" })
          const body = (await res.json()) as Record<string, unknown>
          if (!res.ok) throw new Error(extractError(body))
        })
      )
      ok += results.filter((r) => r.status === "fulfilled").length
      fail += results.filter((r) => r.status === "rejected").length
    }

    if (fail > 0 && ok > 0) {
      showToast.error("Eliminar", `${ok} removido(s), ${fail} falharam`)
    } else if (fail > 0) {
      showToast.error("Eliminar", "Não foi possível eliminar os ficheiros")
    } else {
      showToast.success(
        "Removido",
        ids.length === 1 ? "Ficheiro eliminado" : `${ids.length} ficheiros eliminados`
      )
    }

    setDeleteOpen(false)
    setDeleteTargets([])
    setDeleting(false)
    void fetchGroups()
    await fetchList(page)
  }

  const total = pagination?.total ?? 0
  const pageCount = pagination?.pageCount ?? 0
  const current = (pagination?.page ?? 0) + 1
  const maxPage = Math.max(pageCount - 1, 0)
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, total)
  const deleteCount = deleteTargets.length
  const hasGroupFilter = Boolean(groupFilter)

  const renderRowMeta = (row: MediaRow) => {
    const groupLabel = row.groupSlug ? labelFor(row.groupSlug) : null
    const metaBits = [groupLabel, row.source].filter(
      (x): x is string => typeof x === "string" && x.length > 0
    )
    return metaBits.length > 0 ? metaBits.join(" · ") : null
  }

  const renderMediaActions = (row: MediaRow, compact?: boolean) => {
    const src = row.url || row.imageUrl || ""
    return (
      <div className={cn("flex gap-1", compact ? "flex-row" : "flex-col gap-0.5 pt-0.5")}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn(
            "justify-center gap-1 font-medium",
            compact ? "h-7 px-2 text-[10px]" : "h-6 sm:h-7 w-full px-1 text-[9px] sm:text-[10px]"
          )}
          onClick={() => void copyUrl(src)}
        >
          <Copy className="h-3 w-3 shrink-0" />
          Copiar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive",
            compact ? "h-7 px-2 text-[10px]" : "h-6 px-1 w-full text-[9px] sm:text-[10px]"
          )}
          onClick={() => openDeleteDialog([row])}
        >
          <Trash2 className="h-3 w-3 shrink-0" />
          Eliminar
        </Button>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Biblioteca de media" }]}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <PageToolbar
          icon={Images}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          title="Biblioteca de media"
          subtitle={
            loading ? "A carregar…" : `${total} ficheiro${total !== 1 ? "s" : ""} · todos os uploads do backoffice`
          }
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void uploadFile(f)
              e.target.value = ""
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Enviar
          </Button>
        </PageToolbar>

        <div className="flex-1 overflow-auto p-4 md:p-5 bg-background">
          <DataPanel className="mb-3">
            <DataPanelContent className="p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
                  <FormField label="Pasta / marca" className="min-w-0 sm:min-w-[180px]">
                    <Select
                      value={groupFilter || "all"}
                      onValueChange={(v) => setGroupFilter(v === "all" ? "" : v)}
                    >
                      <SelectTrigger size="sm" className="h-8 w-full text-xs lg:w-[220px]">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">
                          Todas
                        </SelectItem>
                        <SelectItem value={GROUP_FILTER_NONE} className="text-xs">
                          Sem pasta
                        </SelectItem>
                        {filterGroupOptions.map((g) => (
                          <SelectItem key={g} value={g} className="text-xs">
                            {labelFor(g)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Pasta ao enviar" className="min-w-0 sm:min-w-[200px]">
                    <Select value={uploadGroup} onValueChange={setUploadGroup}>
                      <SelectTrigger size="sm" className="h-8 w-full text-xs lg:w-[220px]">
                        <SelectValue placeholder="Escolher pasta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MEDIA_GROUP_NO_BRAND} className="text-xs">
                          Sem marca
                        </SelectItem>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={b.slug.toLowerCase()} className="text-xs">
                            {b.name}
                          </SelectItem>
                        ))}
                        <SelectItem value={UPLOAD_CUSTOM} className="text-xs">
                          Outra pasta…
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {uploadGroup === UPLOAD_CUSTOM && (
                      <Input
                        value={uploadCustomGroup}
                        onChange={(e) => setUploadCustomGroup(e.target.value)}
                        placeholder="ex. campanhas-verao"
                        className="mt-1.5 h-8 text-xs"
                      />
                    )}
                  </FormField>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {hasGroupFilter ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground"
                      onClick={() => setGroupFilter("")}
                    >
                      <X className="h-3.5 w-3.5" />
                      Limpar filtros
                    </Button>
                  ) : null}
                  {items.length > 0 && (
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      onClick={toggleSelectAllOnPage}
                    >
                      <SelectionCheckbox
                        checked={allOnPageSelected}
                        indeterminate={someOnPageSelected}
                        onChange={toggleSelectAllOnPage}
                        className="h-5 w-5 pointer-events-none"
                        interactive={false}
                      />
                      Seleccionar página
                    </button>
                  )}
                  <div className="flex rounded-md border border-border/70 bg-muted/30 p-0.5">
                    <Button
                      type="button"
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setView("grid")}
                      aria-label="Vista em grelha"
                      aria-pressed={viewMode === "grid"}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setView("list")}
                      aria-label="Vista em lista"
                      aria-pressed={viewMode === "list"}
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </DataPanelContent>
          </DataPanel>

          {selectedIds.size > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/[0.04] px-3 py-2.5">
              <p className="text-xs font-medium text-foreground">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSelection}>
                  Limpar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={openDeleteSelected}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar seleccionados
                </Button>
              </div>
            </div>
          )}

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="mb-4 rounded-md border border-dashed border-border/80 bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5 text-foreground/80">
              <Link2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
              Arraste imagens para aqui ou use <strong className="font-medium">Enviar</strong>. Produtos, banners e
              variantes aparecem automaticamente. JPEG, PNG, WebP, GIF · máx. 10 MB
            </span>
          </div>

          {loading && viewMode === "grid" && (
            <DataPanel className="p-2">
              <div className={gridMedia}>
                {[...Array(24)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-md" />
                ))}
              </div>
            </DataPanel>
          )}

          {loading && viewMode === "list" && (
            <DataPanel className="space-y-2 p-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </DataPanel>
          )}

          {!loading && items.length === 0 && (
            <DataPanel className="border-dashed">
              <EmptyState
                icon={Images}
                tone="info"
                title="Sem ficheiros nesta página"
                description="Envia uma imagem ou muda a pasta para encontrar ficheiros existentes."
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Enviar imagem
                  </Button>
                }
              />
            </DataPanel>
          )}

          {!loading && items.length > 0 && viewMode === "grid" && (
            <DataPanel className="p-2">
              <div className={gridMedia}>
                {items.map((row) => {
                  const src = row.url || row.imageUrl || ""
                  const name = row.originalFilename || "imagem"
                  const meta = renderRowMeta(row)
                  const isSelected = selectedIds.has(row.id)
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        "group/check relative flex flex-col overflow-hidden rounded-md border bg-card shadow-xs transition-colors hover:border-primary/40",
                        isSelected ? "border-primary ring-1 ring-primary/30" : "border-border/70"
                      )}
                    >
                      <div className="absolute left-1.5 top-1.5 z-10">
                        <SelectionCheckbox
                          checked={isSelected}
                          onChange={() => toggleSelect(row.id)}
                          className={cn(
                            "shadow-sm backdrop-blur-sm",
                            !isSelected &&
                              "opacity-100 sm:opacity-0 sm:group-hover/check:opacity-100 sm:group-focus-within/check:opacity-100"
                          )}
                          ariaLabel={`Selecionar ${name}`}
                        />
                      </div>
                      <div className="relative aspect-square bg-muted/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                      </div>
                      <div className="min-h-0 space-y-0.5 p-1 sm:p-1.5">
                        <p
                          className="truncate text-[9px] font-medium leading-tight text-foreground/90 sm:text-[10px]"
                          title={name}
                        >
                          {name}
                        </p>
                        {meta ? (
                          <p className="truncate text-[8px] text-muted-foreground sm:text-[9px]" title={meta}>
                            {meta}
                          </p>
                        ) : null}
                        <p className="text-[8px] tabular-nums text-muted-foreground/80">
                          {formatBytes(row.byteSize ?? null)}
                        </p>
                        {renderMediaActions(row)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </DataPanel>
          )}

          {!loading && items.length > 0 && viewMode === "list" && (
            <DataPanel>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 pl-3" />
                    <TableHead className="w-14" />
                    <TableHead className="text-[11px]">Nome</TableHead>
                    <TableHead className="text-[11px] hidden md:table-cell">Grupo / origem</TableHead>
                    <TableHead className="text-[11px] w-20">Tamanho</TableHead>
                    <TableHead className="text-[11px] w-36 text-right pr-3">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => {
                    const src = row.url || row.imageUrl || ""
                    const name = row.originalFilename || "imagem"
                    const meta = renderRowMeta(row)
                    const isSelected = selectedIds.has(row.id)
                    return (
                      <TableRow
                        key={row.id}
                        className={cn("group cursor-pointer", isSelected && "bg-primary/[0.04]")}
                        onClick={() => toggleSelect(row.id)}
                      >
                        <TableCell className="pl-3 py-2">
                          <SelectionCheckbox
                            checked={isSelected}
                            onChange={() => toggleSelect(row.id)}
                            ariaLabel={`Selecionar ${name}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="h-10 w-10 rounded-md border border-border/60 bg-muted/40 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-xs font-medium truncate max-w-[200px] lg:max-w-xs" title={name}>
                            {name}
                          </p>
                        </TableCell>
                        <TableCell className="py-2 hidden md:table-cell">
                          <p className="text-[11px] text-muted-foreground truncate max-w-[180px]" title={meta ?? ""}>
                            {meta ?? "—"}
                          </p>
                        </TableCell>
                        <TableCell className="py-2 text-[11px] text-muted-foreground tabular-nums">
                          {formatBytes(row.byteSize ?? null)}
                        </TableCell>
                        <TableCell className="py-2 pr-3" onClick={(e) => e.stopPropagation()}>
                          {renderMediaActions(row, true)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </DataPanel>
          )}

          {!loading && total > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {rangeStart}–{rangeEnd} de {total} · {PAGE_SIZE} por página
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Button>
                <span className="text-[11px] text-muted-foreground tabular-nums min-w-[72px] text-center">
                  {current} / {Math.max(pageCount, 1)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={page >= maxPage}
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                >
                  Seguinte
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) {
            setDeleteOpen(open)
            if (!open) setDeleteTargets([])
          }
        }}
      >
        <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden" showCloseButton={!deleting}>
          <div className="px-6 pt-6 pb-4">
            <DialogHeader className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/5">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="space-y-1.5 text-left">
                <DialogTitle className="text-base">
                  {deleteCount === 1 ? "Eliminar este ficheiro?" : `Eliminar ${deleteCount} ficheiros?`}
                </DialogTitle>
                <DialogDescription className="text-xs leading-relaxed">
                  Esta ação é permanente. Os ficheiros serão removidos da biblioteca e do armazenamento — não é
                  possível recuperar.
                </DialogDescription>
              </div>
            </DialogHeader>

            {deleteTargets.length > 0 && (
              <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-2.5">
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {deleteTargets.slice(0, 16).map((row) => {
                    const src = row.url || row.imageUrl || ""
                    return (
                      <div
                        key={row.id}
                        className="h-12 w-12 rounded-md border border-border/60 bg-background overflow-hidden shrink-0"
                        title={row.originalFilename ?? "imagem"}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </div>
                    )
                  })}
                  {deleteTargets.length > 16 && (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border/70 bg-background text-[10px] font-medium text-muted-foreground">
                      +{deleteTargets.length - 16}
                    </div>
                  )}
                </div>
                {deleteCount === 1 && deleteTargets[0]?.originalFilename && (
                  <p className="mt-2 text-[11px] text-muted-foreground truncate">
                    {deleteTargets[0].originalFilename}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-4 sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 text-xs gap-1.5 min-w-[100px]"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  A eliminar…
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleteCount === 1 ? "Eliminar" : `Eliminar ${deleteCount}`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
