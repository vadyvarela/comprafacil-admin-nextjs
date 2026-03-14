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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function CouponsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { data, loading, error, refetch } = useQuery<{
    coupons: Coupon[]
  }>(GET_COUPONS)

  const filteredCoupons =
    data?.coupons.filter((coupon) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return coupon.name.toLowerCase().includes(query)
    }) || []

  const total = data?.coupons?.length ?? 0

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Cupons" }]} />
      <div className="flex flex-1 flex-col min-h-0">
        <div className="border-b border-border bg-card">
          <div className="px-4 py-2.5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-base font-semibold tracking-tight">Cupons</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {total} cupom{total !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative w-56 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden />
                  <Input
                    placeholder="Nome do cupom…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                    aria-label="Buscar cupons"
                  />
                </div>
                <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Novo
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 pt-3">
            {loading && (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded" />
                ))}
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-md border border-destructive/50 bg-destructive/10 text-xs">
                <p className="font-medium text-destructive">Erro ao carregar</p>
                <p className="text-muted-foreground mt-1">{error.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                  Tentar novamente
                </Button>
              </div>
            )}

            {!loading && !error && (
              <>
                {filteredCoupons.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-sm mx-auto"
                    role="status"
                    aria-label={searchQuery ? "Nenhum resultado" : "Nenhum cupom"}
                  >
                    <TicketPercent className="h-10 w-10 text-muted-foreground mb-4" />
                    <h2 className="text-sm font-semibold text-foreground mb-1">
                      {searchQuery ? "Nenhum resultado" : "Nenhum cupom"}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      {searchQuery
                        ? "Tente outro termo ou remova o filtro de busca."
                        : "Crie o primeiro cupom para começar."}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setCreateModalOpen(true)} size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Criar cupom
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCoupons.map((coupon) => {
                      const discountType = coupon.percentOff
                        ? "percent"
                        : coupon.amountOff
                        ? "amount"
                        : null

                      return (
                        <Link
                          key={coupon.id}
                          href={`/dashboard/coupons/${coupon.id}`}
                          className="group block"
                        >
                          <div className="flex items-center gap-3 p-3 rounded border hover:bg-accent/50 hover:border-border transition-colors">
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <TicketPercent className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                  {coupon.name}
                                </h3>
                                {coupon.defaultCoupon && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                    Padrão
                                  </Badge>
                                )}
                                {coupon.status && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
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
                                {coupon.duration && (
                                  <span>{coupon.duration}</span>
                                )}
                                {coupon.redeemBy && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Válido até {new Date(coupon.redeemBy).toLocaleDateString("pt-PT")}
                                  </span>
                                )}
                                {coupon.promotionCodeCount && (
                                  <span>
                                    {coupon.promotionCodeCount.count} código
                                    {coupon.promotionCodeCount.count !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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

        <CreateCouponModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />
    </>
  )
}

