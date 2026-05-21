"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  GET_COUNTRIES,
  GET_PICKUP_POINTS,
  GET_SHIPPING_TIERS,
  GET_STATES,
} from "@/lib/graphql/shipping/queries"
import {
  DELETE_PICKUP_POINT,
  DELETE_SHIPPING_TIER,
  UPSERT_PICKUP_POINT,
  UPSERT_SHIPPING_TIER,
} from "@/lib/graphql/shipping/mutations"
import type {
  CountriesQueryData,
  DeliveryMethod,
  PickupPointsQueryData,
  ShippingTierGql,
  ShippingTiersQueryData,
  StatesQueryData,
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

export default function ShippingSettingsPage() {
  const [islandId, setIslandId] = useState("")
  const [method, setMethod] = useState<DeliveryMethod>("HOME")
  const [tierForm, setTierForm] = useState(EMPTY_TIER)
  const [editingTierId, setEditingTierId] = useState<string | null>(null)

  const { data: countriesData } = useQuery<CountriesQueryData>(GET_COUNTRIES)
  const cvCountryId = useMemo(() => {
    const list = countriesData?.countries ?? []
    const cv = list.find((c) => c.name?.toLowerCase().includes("cabo"))
    return cv?.id ?? list[0]?.id ?? ""
  }, [countriesData])

  const { data: statesData, loading: statesLoading } = useQuery<StatesQueryData>(GET_STATES, {
    variables: { countryId: cvCountryId },
    skip: !cvCountryId,
  })

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

  useEffect(() => {
    if (!islandId && statesData?.states?.[0]?.id) {
      setIslandId(statesData.states[0].id)
    }
  }, [islandId, statesData])

  const tiers = tiersData?.shippingTiers ?? []

  async function handleSaveTier() {
    if (!islandId) return
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

  async function handleDeleteTier(id: string) {
    try {
      await deleteTier({ variables: { id } })
      toast.success("Faixa removida")
      await refetchTiers()
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

        <Card>
          <CardContent className="pt-5 flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs">Ilha</Label>
              {statesLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <select
                  value={islandId}
                  onChange={(e) => setIslandId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {(statesData?.states ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Modo</Label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as DeliveryMethod)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="HOME">Ao domicílio</option>
                <option value="PICKUP">Levantamento</option>
              </select>
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
                        className="flex items-center justify-between gap-2 rounded-md border border-border/80 px-3 py-2 text-xs"
                      >
                        <span>
                          {t.minSubtotal}
                          {t.maxSubtotal != null ? ` – ${t.maxSubtotal}` : "+"} ECV →{" "}
                          <strong>{t.shippingPrice === 0 ? "Grátis" : `${t.shippingPrice} ECV`}</strong>
                          {t.etaLabel ? ` · ${t.etaLabel}` : ""}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          <Button type="button" variant="ghost" size="sm" onClick={() => startEditTier(t)}>
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTier(t.id)}
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
                <div>
                  <Label className="text-xs">Subtotal mín. (ECV)</Label>
                  <Input
                    value={tierForm.minSubtotal}
                    onChange={(e) => setTierForm((f) => ({ ...f, minSubtotal: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Subtotal máx. (vazio = ∞)</Label>
                  <Input
                    value={tierForm.maxSubtotal}
                    onChange={(e) => setTierForm((f) => ({ ...f, maxSubtotal: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Preço envio (ECV)</Label>
                  <Input
                    value={tierForm.shippingPrice}
                    onChange={(e) => setTierForm((f) => ({ ...f, shippingPrice: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Prazo (texto)</Label>
                  <Input
                    value={tierForm.etaLabel}
                    onChange={(e) => setTierForm((f) => ({ ...f, etaLabel: e.target.value }))}
                    placeholder="24–48h"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveTier}
                disabled={savingTier || !islandId}
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
                    className="flex justify-between items-center rounded-md border border-border/80 px-3 py-2"
                  >
                    <span>{p.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deletePickup({ variables: { id: p.id } })
                        await refetchPickup()
                      }}
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
    </>
  )
}
