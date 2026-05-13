"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Copy,
  Images,
  Loader2,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Link2,
} from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
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
import { showToast } from "@/lib/utils/toast"

const GROUP_FILTER_NONE = "__none__"

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

const gridMedia =
  "grid gap-1.5 sm:gap-2 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10"

export default function MediaLibraryPage() {
  const [page, setPage] = useState(0)
  const [size] = useState(24)
  const [groupFilter, setGroupFilter] = useState("")
  const [uploadGroup, setUploadGroup] = useState("")
  const [groupOptions, setGroupOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<MediaRow[]>([])
  const [pagination, setPagination] = useState<ListPayload["pagination"]>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
        const qs = new URLSearchParams({ page: String(pageNum), size: String(size) })
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
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao carregar"
        showToast.error("Biblioteca", msg)
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [size, groupFilter]
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

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast.error("Formato", "Selecione uma imagem")
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
      if (uploadGroup.trim()) fd.append("group", uploadGroup.trim())
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

  const remove = async (row: MediaRow) => {
    if (!confirm("Remover este ficheiro da biblioteca e do armazenamento?")) return
    setDeletingId(row.id)
    try {
      const res = await fetch(`/api/media/${row.id}`, { method: "DELETE" })
      const body = (await res.json()) as Record<string, unknown>
      if (!res.ok) {
        throw new Error(extractError(body))
      }
      showToast.success("Removido", "Ficheiro apagado")
      void fetchGroups()
      await fetchList(page)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao apagar"
      showToast.error("Apagar", msg)
    } finally {
      setDeletingId(null)
    }
  }

  const total = pagination?.total ?? 0
  const pageCount = pagination?.pageCount ?? 0
  const current = (pagination?.page ?? 0) + 1
  const maxPage = Math.max(pageCount - 1, 0)

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
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
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
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1 min-w-[140px]">
              <p className="text-[10px] text-muted-foreground">Grupo</p>
              <Select
                value={groupFilter || "all"}
                onValueChange={(v) => setGroupFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger size="sm" className="h-8 w-[200px] max-w-full text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Todos
                  </SelectItem>
                  <SelectItem value={GROUP_FILTER_NONE} className="text-xs">
                    Sem grupo
                  </SelectItem>
                  {groupOptions.map((g) => (
                    <SelectItem key={g} value={g} className="text-xs">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[160px] max-w-xs">
              <p className="text-[10px] text-muted-foreground">Pasta ao enviar (opcional)</p>
              <Input
                value={uploadGroup}
                onChange={(e) => setUploadGroup(e.target.value)}
                placeholder="ex. campanhas-verao"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="mb-4 rounded-md border border-dashed border-border/80 bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5 text-foreground/80">
              <Link2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
              Arraste imagens para aqui ou use <strong className="font-medium">Enviar</strong>. Produtos, banners e
              variantes aparecem automaticamente. JPEG, PNG, WebP, GIF, SVG · máx. 10 MB
            </span>
          </div>

          {loading && (
            <div className={gridMedia}>
              {[...Array(20)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem ficheiros nesta página.</p>
          )}

          {!loading && items.length > 0 && (
            <div className={gridMedia}>
              {items.map((row) => {
                const src = row.url || row.imageUrl || ""
                const name = row.originalFilename || "imagem"
                const metaBits = [row.groupSlug, row.source].filter(
                  (x): x is string => typeof x === "string" && x.length > 0
                )
                const meta = metaBits.length > 0 ? metaBits.join(" · ") : null
                return (
                  <div
                    key={row.id}
                    className="group relative flex flex-col rounded-md border border-border/70 bg-card overflow-hidden"
                  >
                    <div className="aspect-square bg-muted/40 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-1 sm:p-1.5 space-y-0.5 min-h-0">
                      <p className="text-[9px] sm:text-[10px] leading-tight truncate font-medium text-foreground/90" title={name}>
                        {name}
                      </p>
                      {meta ? (
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground truncate" title={meta}>
                          {meta}
                        </p>
                      ) : null}
                      <p className="text-[8px] text-muted-foreground/80 tabular-nums">
                        {formatBytes(row.byteSize ?? null)}
                      </p>
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-6 sm:h-7 w-full justify-center gap-1 px-1 text-[9px] sm:text-[10px] font-medium"
                          onClick={() => void copyUrl(src)}
                        >
                          <Copy className="h-3 w-3 shrink-0" />
                          Copiar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-6 px-1 w-full text-[9px] sm:text-[10px]"
                          disabled={deletingId === row.id}
                          onClick={() => void remove(row)}
                        >
                          {deletingId === row.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 inline mr-0.5" />
                              Apagar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] text-muted-foreground tabular-nums px-2">
                {current} / {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page >= maxPage}
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
