"use client"

import { useState } from "react"
import { useQuery } from "@apollo/client/react"
import { GET_COUPONS } from "@/lib/graphql/coupons/queries"
import { Coupon } from "@/lib/graphql/coupons/types"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { CreateCouponModal } from "@/components/coupons/create-coupon-modal"
import Link from "next/link"
import {
  TicketPercent,
  Plus,
  Search,
  ArrowRight,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function CouponsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { data, loading, error, refetch } = useQuery<{ coupons: Coupon[] }>(GET_COUPONS)

  const filteredCoupons =
    data?.coupons.filter((coupon) => {
      if (!searchQuery.trim()) return true
      return coupon.name.toLowerCase().includes(searchQuery.toLowerCase())
    }) || []

  const total = data?.coupons?.length ?? 0

  const isExpired = (coupon: Coupon) => {
    if (!coupon.redeemBy) return false
    return new Date(coupon.redeemBy) < new Date()
  }

  const isActive = (coupon: Coupon) => {
    const statusCode = coupon.status?.code?.toUpperCase()
    if (statusCode && statusCode !== "ACTIVE") return false
    if (isExpired(coupon)) return false
    return true
  }

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cupons" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        {/* Toolbar */}
        <div className="border-b border-border bg-card/60 backdrop-blur">
          <div className="px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TicketPercent className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-foreground">Cupons</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loading ? "A carregar…" : `${total} cupom${total !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative w-56 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Nome do cupom…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Novo cupom
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/5 text-xs">
              <p className="font-semibold text-destructive mb-1">Erro ao carregar</p>
              <p className="text-muted-foreground mb-3">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {filteredCoupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                    <TicketPercent className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <h2 className="text-sm font-semibold mb-1">
                    {searchQuery ? "Nenhum resultado" : "Sem cupons"}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {searchQuery ? "Tente outro termo." : "Crie o primeiro cupom de desconto."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Criar cupom
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCoupons.map((coupon) => {
                    const active = isActive(coupon)
                    const expired = isExpired(coupon)
                    const discountType = coupon.percentOff ? "percent" : coupon.amountOff ? "amount" : null

                    return (
                      <Link
                        key={coupon.id}
                        href={`/dashboard/coupons/${coupon.id}`}
                        className="group block"
                      >
                        <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                              <TicketPercent className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {coupon.defaultCoupon && (
                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium badge-info">
                                  Padrão
                                </span>
                              )}
                              {active ? (
                                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium badge-success">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Ativo
                                </span>
                              ) : expired ? (
                                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium badge-danger">
                                  <XCircle className="h-3 w-3" />
                                  Expirado
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium badge-neutral">
                                  Inativo
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Name */}
                          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors mb-1">
                            {coupon.name}
                          </h3>

                          {/* Discount value */}
                          {discountType === "percent" && (
                            <div className="flex items-center gap-1 text-lg font-bold text-emerald-600 mb-2">
                              <Percent className="h-4 w-4" />
                              {coupon.percentOff}% OFF
                            </div>
                          )}
                          {discountType === "amount" && (
                            <div className="flex items-center gap-1 text-lg font-bold text-emerald-600 mb-2">
                              <DollarSign className="h-4 w-4" />
                              {coupon.amountOff} {coupon.currency}
                            </div>
                          )}

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {coupon.redeemBy && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(coupon.redeemBy).toLocaleDateString("pt-PT")}
                              </span>
                            )}
                            {coupon.promotionCodeCount && (
                              <span>
                                {coupon.promotionCodeCount.count} código{coupon.promotionCodeCount.count !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateCouponModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  )
}
