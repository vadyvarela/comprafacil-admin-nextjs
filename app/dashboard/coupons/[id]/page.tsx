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
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    )
  }

  if (error || !coupon) {
    return (
      <>
        <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cupons", href: "/dashboard/coupons" }, { label: "Detalhe" }]} />
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <div className="text-center space-y-3 max-w-md">
            <TicketPercent className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">
                {error ? "Erro ao carregar cupom" : "Cupom não encontrado"}
              </h2>
              {error && (
                <p className="text-sm text-muted-foreground mt-1">
                  {error.message}
                </p>
              )}
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
      <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="border-b px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold truncate">
                    {coupon.name}
                  </h1>
                  {coupon.defaultCoupon && (
                    <Badge variant="secondary" className="text-xs">
                      Padrão
                    </Badge>
                  )}
                  {coupon.status && (
                    <Badge variant="outline" className="text-xs">
                      {coupon.status.code}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {discountType === "percent" && (
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      {coupon.percentOff}% OFF
                    </span>
                  )}
                  {discountType === "amount" && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {coupon.amountOff} {coupon.currency}
                    </span>
                  )}
                  {coupon.duration && <span>{coupon.duration}</span>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-3.5 w-3.5 mr-1.5" />
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

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Details */}
                <div className="border rounded p-3">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Informações</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">ID</p>
                      <p className="font-mono text-[10px] break-all">{coupon.id}</p>
                    </div>
                    {coupon.maxRedemptions && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Máx. Resgates</p>
                        <p className="font-medium">{coupon.maxRedemptions}</p>
                      </div>
                    )}
                    {coupon.redeemBy && (
                      <div>
                        <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Válido até
                        </p>
                        <p className="font-medium">
                          {new Date(coupon.redeemBy).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    )}
                    {coupon.durationInMonths && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Duração</p>
                        <p className="font-medium">{coupon.durationInMonths} meses</p>
                      </div>
                    )}
                    {coupon.product && (
                      <div>
                        <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Produto
                        </p>
                        <p className="font-medium">{coupon.product.title}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">Códigos de Promoção</h2>
                    <p className="text-xs text-muted-foreground">
                      {coupon.promotionCodes?.length ?? 0} código(s) associado(s) a este cupom
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAddCodeOpen(true)}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar código
                  </Button>
                </div>

                {coupon.promotionCodes && coupon.promotionCodes.length > 0 ? (
                  <div className="space-y-1.5">
                    {coupon.promotionCodes.map((code) => (
                      <div
                        key={code.id}
                        className="flex items-center justify-between gap-3 p-3 border rounded hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm">{code.code}</h3>
                            {code.status && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {code.status.code}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {code.timesRedeemed || 0} / {code.maxRedemptions} resgates
                            </span>
                            {code.expiresAt && (
                              <span>
                                Expira em {new Date(code.expiresAt).toLocaleDateString("pt-PT")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed rounded-lg bg-muted/30">
                    <TicketPercent className="h-7 w-7 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground mb-0.5">Nenhum código associado</p>
                    <p className="text-xs text-muted-foreground max-w-[280px] mb-3">
                      Crie um código para os clientes usarem no checkout.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAddCodeOpen(true)}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar código
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
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

