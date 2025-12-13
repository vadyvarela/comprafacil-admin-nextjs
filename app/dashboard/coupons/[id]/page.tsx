"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { useParams, useRouter } from "next/navigation"
import { GET_COUPON_DETAILS } from "@/lib/graphql/coupons/queries"
import { DELETE_COUPON } from "@/lib/graphql/coupons/mutations"
import { AppSidebar } from "@/components/app-sidebar"
import { CreateCouponModal } from "@/components/coupons/create-coupon-modal"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function CouponDetailPage() {
  const params = useParams()
  const router = useRouter()
  const couponId = params.id as string
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const [deleteCoupon, { loading: deleting }] = useMutation(DELETE_COUPON, {
    refetchQueries: [{ query: GET_COUPON_DETAILS, variables: { couponId } }],
    onCompleted: () => {
      router.push("/dashboard/coupons")
    },
  })

  const { data, loading, error } = useQuery(GET_COUPON_DETAILS, {
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

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error || !coupon) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
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
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const discountType = coupon.percentOff
    ? "percent"
    : coupon.amountOff
    ? "amount"
    : null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/coupons">Cupons</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate text-sm">
                  {coupon.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

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
                <div className="mb-3">
                  <h2 className="text-base font-semibold">Códigos de Promoção</h2>
                  <p className="text-xs text-muted-foreground">
                    {coupon.promotionCodes?.length || 0} código
                    {(coupon.promotionCodes?.length || 0) !== 1 ? "s" : ""} cadastrado
                    {(coupon.promotionCodes?.length || 0) !== 1 ? "s" : ""}
                  </p>
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
                  <div className="flex flex-col items-center justify-center py-12 text-center border rounded">
                    <TicketPercent className="h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="text-sm font-medium mb-1">Nenhum código</h3>
                    <p className="text-xs text-muted-foreground">
                      Códigos de promoção serão criados automaticamente
                    </p>
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
      </SidebarInset>
    </SidebarProvider>
  )
}

