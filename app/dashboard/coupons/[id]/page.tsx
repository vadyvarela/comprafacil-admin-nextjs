"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { useParams, useRouter } from "next/navigation"
import { GET_COUPON_DETAILS } from "@/lib/graphql/coupons/queries"
import { DELETE_COUPON, CREATE_PROMOTION_CODE } from "@/lib/graphql/coupons/mutations"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { CreateCouponModal } from "@/components/coupons/create-coupon-modal"
import { Button } from "@/components/ui/button"
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [addCodeOpen, setAddCodeOpen] = useState(false)
  const [newCode, setNewCode] = useState({ code: "", maxRedemptions: "1", expiresAt: "" })

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
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cupons", href: "/dashboard/coupons" }, { label: "…" }]} />
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-32 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="col-span-2 h-48 rounded-xl" />
          </div>
        </div>
      </>
    )
  }

  if (error || !coupon) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cupons", href: "/dashboard/coupons" }, { label: "Detalhe" }]} />
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
              <TicketPercent className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {error ? "Erro ao carregar cupom" : "Cupom não encontrado"}
              </h2>
              {error && <p className="text-sm text-muted-foreground mt-1">{error.message}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/coupons")}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Voltar
            </Button>
          </div>
        </div>
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
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cupons", href: "/dashboard/coupons" }, { label: coupon.name }]} />
      <div className="flex flex-1 flex-col bg-grid">
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-6 space-y-6">

            {/* Hero */}
            <div className="animate-enter relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-amber-500/[0.04] p-6">
              <div className="absolute inset-0 bg-grid opacity-30" />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
                    <TicketPercent className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                      <h1 className="text-xl font-bold tracking-tight truncate">{coupon.name}</h1>
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
                      onClick={() => {
                        if (confirm("Tem certeza que deseja excluir este cupom?")) {
                          handleDelete()
                        }
                      }}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Excluir
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
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                      <Info className="h-3 w-3 text-primary" />
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
                        <span className="text-[11px] text-muted-foreground">Máx. Resgates</span>
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
                </div>
              </div>

              {/* Main: promo codes */}
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                        <Copy className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold">Códigos de Promoção</h2>
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
                    <div className="divide-y divide-border">
                      {coupon.promotionCodes.map((code) => (
                        <div
                          key={code.id}
                          className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/10"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                            <TicketPercent className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold font-mono text-sm tracking-wide">{code.code}</span>
                              {code.status && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                                  {code.status.code}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="tabular-nums">{code.timesRedeemed || 0}/{code.maxRedemptions} resgates</span>
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
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                        <TicketPercent className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-sm font-bold mb-1">Nenhum código</h3>
                      <p className="text-xs text-muted-foreground max-w-[280px] mb-4">
                        Crie um código para os clientes usarem no checkout.
                      </p>
                      <Button size="sm" onClick={() => setAddCodeOpen(true)} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar código
                      </Button>
                    </div>
                  )}
                </div>
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
              O código será vinculado a este cupom. Os clientes usam-no no checkout.
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
              <Label htmlFor="promo-max">Máx. resgates *</Label>
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
                    Criando…
                  </>
                ) : (
                  "Criar código"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
