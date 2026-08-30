"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { useParams, useRouter } from "next/navigation"
import { GET_COUPON_DETAILS } from "@/lib/graphql/coupons/queries"
import { DELETE_COUPON, CREATE_PROMOTION_CODE } from "@/lib/graphql/coupons/mutations"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DataPanel } from "@/components/admin/data-panel"
import { EmptyState } from "@/components/admin/empty-state"
import { CreateCouponModal } from "@/components/coupons/create-coupon-modal"
import { Button } from "@/components/ui/button"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pencil,
  MoreVertical,
  Trash2,
  TicketPercent,
  Loader2,
  ArrowLeft,
  Percent,
  DollarSign,
  Calendar,
  Package,
  Info,
  Plus,
  Copy,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { CouponDetails } from "@/lib/graphql/coupons/types"

export default function CouponDetailPage() {
  const params = useParams()
  const router = useRouter()
  const couponId = params.id as string
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [addCodeOpen, setAddCodeOpen] = useState(false)
  const [newCode, setNewCode] = useState({ code: "", maxRedemptions: "1", expiresAt: "" })
  const { confirm, confirmDialog } = useConfirmDialog()

  const [deleteCoupon, { loading: deleting }] = useMutation(DELETE_COUPON, {
    refetchQueries: [{ query: GET_COUPON_DETAILS, variables: { couponId } }],
    onCompleted: () => {
      router.push("/dashboard/coupons")
    },
  })

  const [createPromotionCode, { loading: creatingCode }] = useMutation(CREATE_PROMOTION_CODE, {
    refetchQueries: [{ query: GET_COUPON_DETAILS, variables: { couponId } }],
    onCompleted: () => {
      setAddCodeOpen(false)
      setNewCode({ code: "", maxRedemptions: "1", expiresAt: "" })
    },
  })

  const { data, loading, error } = useQuery<{
    couponDetails: CouponDetails
  }>(GET_COUPON_DETAILS, {
    variables: { couponId },
    skip: !couponId,
  })

  const coupon = data?.couponDetails

  const handleDelete = async () => {
    if (!coupon) return
    const confirmed = await confirm({
      title: "Eliminar cupão?",
      description: `Está prestes a eliminar "${coupon.name}".`,
      impact: "Os códigos promocionais associados deixam de funcionar. Esta ação não pode ser desfeita.",
      confirmText: "Eliminar cupão",
      variant: "destructive",
    })

    if (!confirmed) return

    try {
      await deleteCoupon({ variables: { id: coupon.id } })
    } catch (err) {
      console.error("Error deleting coupon:", err)
    }
  }

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coupon || !newCode.code.trim()) return
    const max = Math.max(1, parseInt(newCode.maxRedemptions, 10) || 1)
    try {
      await createPromotionCode({
        variables: {
          input: {
            code: newCode.code.trim().toUpperCase(),
            maxRedemptions: max,
            couponId: coupon.id,
            ...(newCode.expiresAt && {
              expiresAt: `${newCode.expiresAt}T12:00:00`,
            }),
          },
        },
      })
    } catch (err) {
      console.error("Error creating promotion code:", err)
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cupões", href: "/dashboard/coupons" }, { label: "…" }]} />
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-32 rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="col-span-2 h-48 rounded-lg" />
          </div>
        </div>
      </>
    )
  }

  if (error || !coupon) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cupões", href: "/dashboard/coupons" }, { label: "Detalhe" }]} />
        <EmptyState
          icon={TicketPercent}
          title={error ? "Erro ao carregar cupão" : "Cupão não encontrado"}
          description={error?.message}
          tone={error ? "danger" : "warning"}
          className="min-h-[400px]"
          action={
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/coupons")}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Voltar
            </Button>
          }
        />
      </>
    )
  }

  const discountType = coupon.percentOff
    ? "percent"
    : coupon.amountOff
    ? "amount"
    : null

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cupões", href: "/dashboard/coupons" }, { label: coupon.name }]} />
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-5 md:px-5 md:py-6 space-y-5">

            {/* Hero */}
            <div className="animate-enter rounded-lg border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border/60 bg-amber-50">
                    <TicketPercent className="h-5 w-5 text-amber-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                      <h1 className="text-lg font-semibold truncate">{coupon.name}</h1>
                      {coupon.defaultCoupon && (
                        <Badge variant="secondary" className="text-[10px]">Padrão</Badge>
                      )}
                      {coupon.status && (
                        <Badge variant="outline" className="text-[10px] font-mono">{coupon.status.code}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {discountType === "percent" && (
                        <span className="flex items-center gap-1 font-bold text-amber-400">
                          <Percent className="h-3.5 w-3.5" />
                          {coupon.percentOff}% OFF
                        </span>
                      )}
                      {discountType === "amount" && (
                        <span className="flex items-center gap-1 font-bold text-amber-400">
                          <DollarSign className="h-3.5 w-3.5" />
                          {coupon.amountOff} {coupon.currency}
                        </span>
                      )}
                      {coupon.duration && (
                        <span className="text-xs">{coupon.duration}</span>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      <MoreVertical className="h-3.5 w-3.5" />
                      Ações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => void handleDelete()}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          A eliminar...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Eliminar
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Content grid */}
            <div className="grid gap-5 lg:grid-cols-3 animate-enter-delay-1">
              {/* Sidebar */}
              <div className="space-y-5">
                <DataPanel>
                  <div className="flex items-center gap-2 border-b border-border/80 bg-muted/35 px-3 py-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-primary/10">
                      <Info className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold">Informações</span>
                  </div>
                  <div className="p-4 space-y-0 text-xs">
                    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/50">
                      <span className="text-[11px] text-muted-foreground">ID</span>
                      <span className="font-mono text-[10px] break-all text-right">{coupon.id}</span>
                    </div>
                    {coupon.maxRedemptions && (
                      <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50">
                        <span className="text-[11px] text-muted-foreground">Máx. utilizações</span>
                        <span className="font-semibold tabular-nums">{coupon.maxRedemptions}</span>
                      </div>
                    )}
                    {coupon.redeemBy && (
                      <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Válido até</span>
                        <span className="font-medium">{new Date(coupon.redeemBy).toLocaleDateString("pt-PT")}</span>
                      </div>
                    )}
                    {coupon.durationInMonths && (
                      <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50">
                        <span className="text-[11px] text-muted-foreground">Duração</span>
                        <span className="font-medium">{coupon.durationInMonths} meses</span>
                      </div>
                    )}
                    {coupon.product && (
                      <div className="flex items-center justify-between gap-3 py-2.5">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" />Produto</span>
                        <span className="font-medium text-right">{coupon.product.title}</span>
                      </div>
                    )}
                  </div>
                </DataPanel>
              </div>

              {/* Main: promo codes */}
              <div className="lg:col-span-2">
                <DataPanel>
                  <div className="flex items-center justify-between border-b border-border/80 bg-muted/35 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-amber-50">
                        <Copy className="h-4 w-4 text-amber-900" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold">Códigos de Promoção</h2>
                        <p className="text-[11px] text-muted-foreground">
                          {coupon.promotionCodes?.length ?? 0} código{(coupon.promotionCodes?.length ?? 0) !== 1 ? "s" : ""} associado{(coupon.promotionCodes?.length ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setAddCodeOpen(true)}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                    </Button>
                  </div>

                  {coupon.promotionCodes && coupon.promotionCodes.length > 0 ? (
                    <div className="divide-y divide-border/70">
                      {coupon.promotionCodes.map((code) => (
                        <div
                          key={code.id}
                          className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/25"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                            <TicketPercent className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold font-mono text-sm">{code.code}</span>
                              {code.status && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                                  {code.status.code}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="tabular-nums">{code.timesRedeemed || 0}/{code.maxRedemptions} utilizações</span>
                              {code.expiresAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(code.expiresAt).toLocaleDateString("pt-PT")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{ width: `${Math.min(100, ((code.timesRedeemed || 0) / (code.maxRedemptions || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={TicketPercent}
                      title="Nenhum código"
                      description="Crie um código para os clientes usarem no checkout."
                      className="py-16"
                      action={
                        <Button size="sm" onClick={() => setAddCodeOpen(true)} className="gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar código
                        </Button>
                      }
                    />
                  )}
                </DataPanel>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateCouponModal
        coupon={coupon}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />

      <Dialog open={addCodeOpen} onOpenChange={setAddCodeOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Novo código de promoção</DialogTitle>
            <DialogDescription>
              O código será vinculado a este cupão. Os clientes usam-no no checkout.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promo-code">Código *</Label>
              <Input
                id="promo-code"
                value={newCode.code}
                onChange={(e) => setNewCode((p) => ({ ...p, code: e.target.value }))}
                placeholder="Ex: VERAO2026"
                required
                disabled={creatingCode}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-max">Máx. utilizações *</Label>
              <Input
                id="promo-max"
                type="number"
                min={1}
                value={newCode.maxRedemptions}
                onChange={(e) => setNewCode((p) => ({ ...p, maxRedemptions: e.target.value }))}
                disabled={creatingCode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-expires">Válido até (opcional)</Label>
              <Input
                id="promo-expires"
                type="date"
                value={newCode.expiresAt}
                onChange={(e) => setNewCode((p) => ({ ...p, expiresAt: e.target.value }))}
                disabled={creatingCode}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddCodeOpen(false)}
                disabled={creatingCode}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creatingCode || !newCode.code.trim()}>
                {creatingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A criar…
                  </>
                ) : (
                  "Criar código"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  )
}
