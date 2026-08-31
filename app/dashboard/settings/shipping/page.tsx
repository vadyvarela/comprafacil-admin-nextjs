"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  GET_ISLANDS,
  GET_PICKUP_POINTS,
  GET_SHIPPING_TIERS,
} from "@/lib/graphql/shipping/queries"
import {
  DELETE_PICKUP_POINT,
  DELETE_SHIPPING_TIER,
  UPSERT_PICKUP_POINT,
  UPSERT_SHIPPING_TIER,
} from "@/lib/graphql/shipping/mutations"
import type {
  DeliveryMethod,
  IslandsQueryData,
  PickupPointsQueryData,
  ShippingTierGql,
  ShippingTiersQueryData,
} from "@/lib/graphql/shipping/types"
import { Loader2, Plus, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"

const EMPTY_TIER = {
  minSubtotal: "0",
  maxSubtotal: "",
  shippingPrice: "0",
  minDays: "",
  maxDays: "",
  etaLabel: "",
  sortOrder: "0",
}

const NO_ISLAND_VALUE = "__no_island__"

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function ShippingSettingsPage() {
  const [selectedIslandId, setSelectedIslandId] = useState<string | null>(null)
  const [method, setMethod] = useState<DeliveryMethod>("HOME")
  const [tierForm, setTierForm] = useState(EMPTY_TIER)
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const { confirm, confirmDialog } = useConfirmDialog()

  const {
    data: islandsData,
    loading: islandsLoading,
    error: islandsError,
  } = useQuery<IslandsQueryData>(GET_ISLANDS)

  const { states, islandId } = useMemo(() => {
    const list = islandsData?.locations ?? []
    const id =
      selectedIslandId && list.some((s) => s.id === selectedIslandId)
        ? selectedIslandId
        : (list[0]?.id ?? "")
    return { states: list, islandId: id }
  }, [selectedIslandId, islandsData?.locations])

  const {
    data: tiersData,
    loading: tiersLoading,
    refetch: refetchTiers,
  } = useQuery<ShippingTiersQueryData>(GET_SHIPPING_TIERS, {
    variables: {
      islandLocationId: islandId || null,
      deliveryMethod: method,
    },
    skip: !islandId,
  })

  const { data: pickupData, refetch: refetchPickup } = useQuery<PickupPointsQueryData>(
    GET_PICKUP_POINTS,
    { variables: { islandLocationId: islandId }, skip: !islandId }
  )

  const [upsertTier, { loading: savingTier }] = useMutation(UPSERT_SHIPPING_TIER)
  const [deleteTier] = useMutation(DELETE_SHIPPING_TIER)
  const [upsertPickup, { loading: savingPickup }] = useMutation(UPSERT_PICKUP_POINT)
  const [deletePickup] = useMutation(DELETE_PICKUP_POINT)

  const [pickupName, setPickupName] = useState("")

  const tiers = useMemo(() => tiersData?.shippingTiers ?? [], [tiersData?.shippingTiers])

  const tierValidationError = useMemo(() => {
    const minSubtotal = parseOptionalNumber(tierForm.minSubtotal)
    const maxSubtotal = parseOptionalNumber(tierForm.maxSubtotal)
    const shippingPrice = parseOptionalNumber(tierForm.shippingPrice)
    const minDays = parseOptionalNumber(tierForm.minDays)
    const maxDays = parseOptionalNumber(tierForm.maxDays)

    if (minSubtotal === null || minSubtotal < 0) return "Informe um subtotal mínimo válido."
    if (maxSubtotal !== null && maxSubtotal < minSubtotal) {
      return "O subtotal máximo não pode ser menor que o subtotal mínimo."
    }
    if (shippingPrice === null || shippingPrice < 0) return "Informe um preço de envio válido."
    if (minDays !== null && minDays < 0) return "O prazo mínimo não pode ser negativo."
    if (maxDays !== null && minDays !== null && maxDays < minDays) {
      return "O prazo máximo não pode ser menor que o prazo mínimo."
    }

    const draftMax = maxSubtotal ?? Number.POSITIVE_INFINITY
    const overlap = tiers.find((tier) => {
      if (tier.id === editingTierId) return false
      const tierMax = tier.maxSubtotal ?? Number.POSITIVE_INFINITY
      return minSubtotal <= tierMax && tier.minSubtotal <= draftMax
    })

    if (overlap) {
      return `Esta faixa sobrepõe ${overlap.minSubtotal}${overlap.maxSubtotal != null ? ` - ${overlap.maxSubtotal}` : "+"} ECV.`
    }

    return null
  }, [editingTierId, tierForm, tiers])

  async function handleSaveTier() {
    if (!islandId || tierValidationError) return
    try {
      await upsertTier({
        variables: {
          input: {
            id: editingTierId,
            islandLocationId: islandId,
            deliveryMethod: method,
            minSubtotal: parseFloat(tierForm.minSubtotal) || 0,
            maxSubtotal: tierForm.maxSubtotal.trim()
              ? parseFloat(tierForm.maxSubtotal)
              : null,
            shippingPrice: parseFloat(tierForm.shippingPrice) || 0,
            minDays: tierForm.minDays ? parseInt(tierForm.minDays, 10) : null,
            maxDays: tierForm.maxDays ? parseInt(tierForm.maxDays, 10) : null,
            etaLabel: tierForm.etaLabel.trim() || null,
            sortOrder: parseInt(tierForm.sortOrder, 10) || 0,
          },
        },
      })
      toast.success("Faixa guardada")
      setTierForm(EMPTY_TIER)
      setEditingTierId(null)
      await refetchTiers()
    } catch (e) {
      toast.error("Erro ao guardar", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  function startEditTier(t: ShippingTierGql) {
    setEditingTierId(t.id)
    setTierForm({
      minSubtotal: String(t.minSubtotal),
      maxSubtotal: t.maxSubtotal != null ? String(t.maxSubtotal) : "",
      shippingPrice: String(t.shippingPrice),
      minDays: t.minDays != null ? String(t.minDays) : "",
      maxDays: t.maxDays != null ? String(t.maxDays) : "",
      etaLabel: t.etaLabel ?? "",
      sortOrder: String(t.sortOrder ?? 0),
    })
  }

  async function handleDeleteTier(tier: ShippingTierGql) {
    const confirmed = await confirm({
      title: "Remover faixa de envio?",
      description: `Está prestes a remover a faixa ${tier.minSubtotal}${tier.maxSubtotal != null ? ` - ${tier.maxSubtotal}` : "+"} ECV.`,
      impact: "Clientes desta ilha/método podem ficar sem a regra de envio esperada no checkout. Esta ação não pode ser desfeita.",
      confirmText: "Remover faixa",
      variant: "destructive",
    })

    if (!confirmed) return

    try {
      await deleteTier({ variables: { id: tier.id } })
      toast.success("Faixa removida")
      await refetchTiers()
    } catch (e) {
      toast.error("Erro ao remover", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  async function handleDeletePickup(id: string, name: string) {
    const confirmed = await confirm({
      title: "Remover ponto de levantamento?",
      description: `Está prestes a remover "${name}".`,
      impact: "Este ponto deixa de estar disponível para clientes no checkout. Esta ação não pode ser desfeita.",
      confirmText: "Remover ponto",
      variant: "destructive",
    })

    if (!confirmed) return

    try {
      await deletePickup({ variables: { id } })
      toast.success("Ponto de levantamento removido")
      await refetchPickup()
    } catch (e) {
      toast.error("Erro ao remover", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  async function handleAddPickup() {
    if (!islandId || !pickupName.trim()) return
    try {
      await upsertPickup({
        variables: {
          input: {
            islandLocationId: islandId,
            name: pickupName.trim(),
          },
        },
      })
      setPickupName("")
      toast.success("Ponto de levantamento adicionado")
      await refetchPickup()
    } catch (e) {
      toast.error("Erro", { description: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições", href: "/dashboard/settings" },
          { label: "Envios" },
        ]}
      />
      <SettingsSubnav />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <PageHeader
          title="Envios"
          description="Tarifas por ilha e valor de compra (subtotal). Preços em ECV."
        />

        {states.length === 0 && !islandsLoading ? (
          <p className="text-xs text-amber-700 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            {islandsError
              ? `Erro ao carregar ilhas: ${islandsError.message}`
              : "Nenhuma ilha no GTW (tabela locations). Reinicia o payment-gateway para criar as ilhas de Cabo Verde."}
          </p>
        ) : null}

        <Card>
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-[minmax(220px,1fr)_200px]">
            <div className="space-y-1.5">
              <Label>Ilha</Label>
              {islandsLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  value={islandId || NO_ISLAND_VALUE}
                  onValueChange={(value) => {
                    if (value !== NO_ISLAND_VALUE) setSelectedIslandId(value)
                  }}
                  disabled={states.length === 0}
                >
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue placeholder="Escolher ilha" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.length === 0 ? (
                      <SelectItem value={NO_ISLAND_VALUE}>Sem ilhas</SelectItem>
                    ) : null}
                    {states.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Modo</Label>
              <Select value={method} onValueChange={(value) => setMethod(value as DeliveryMethod)}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOME">Ao domicílio</SelectItem>
                  <SelectItem value="PICKUP">Levantamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Faixas de subtotal</h2>
              </div>

              {tiersLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-2">
                  {tiers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem faixas para esta ilha/modo.</p>
                  ) : (
                    tiers.map((t) => (
                      <div
                        key={t.id}
                        className="flex flex-col gap-2 rounded-md border border-border/80 bg-muted/15 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span>
                          {t.minSubtotal}
                          {t.maxSubtotal != null ? ` – ${t.maxSubtotal}` : "+"} ECV →{" "}
                          <strong>{t.shippingPrice === 0 ? "Grátis" : `${t.shippingPrice} ECV`}</strong>
                          {t.etaLabel ? ` · ${t.etaLabel}` : ""}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          <Button type="button" variant="outline" size="sm" onClick={() => startEditTier(t)}>
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTier(t)}
                            aria-label="Remover faixa de envio"
                            title="Remover faixa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2 border-t border-border/60 pt-4">
                <div className="space-y-1.5">
                  <Label>Subtotal mín. (ECV)</Label>
                  <Input
                    value={tierForm.minSubtotal}
                    onChange={(e) => setTierForm((f) => ({ ...f, minSubtotal: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtotal máx. (vazio = ∞)</Label>
                  <Input
                    value={tierForm.maxSubtotal}
                    onChange={(e) => setTierForm((f) => ({ ...f, maxSubtotal: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Preço envio (ECV)</Label>
                  <Input
                    value={tierForm.shippingPrice}
                    onChange={(e) => setTierForm((f) => ({ ...f, shippingPrice: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Prazo (texto)</Label>
                  <Input
                    value={tierForm.etaLabel}
                    onChange={(e) => setTierForm((f) => ({ ...f, etaLabel: e.target.value }))}
                    placeholder="24–48h"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              {tierValidationError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {tierValidationError}
                </p>
              ) : null}
              <Button
                type="button"
                size="sm"
                onClick={handleSaveTier}
                disabled={savingTier || !islandId || Boolean(tierValidationError)}
              >
                {savingTier ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {editingTierId ? "Actualizar faixa" : "Adicionar faixa"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-4">
              <h2 className="text-sm font-semibold">Pontos de levantamento</h2>
              <ul className="space-y-1.5 text-xs">
                {(pickupData?.pickupPoints ?? []).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-md border border-border/80 bg-muted/15 px-3 py-2"
                  >
                    <span>{p.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePickup(p.id, p.name)}
                      aria-label={`Remover ponto ${p.name}`}
                      title="Remover ponto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  placeholder="Nome do ponto"
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddPickup}
                  disabled={savingPickup || !pickupName.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {confirmDialog}
    </>
  )
}
