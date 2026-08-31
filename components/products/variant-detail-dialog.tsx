"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Field } from "@/components/products/product-form-layout"
import { VariantGalleryUpload } from "./variant-gallery-upload"
import type { ProductVariantCombination } from "./variant-manager-types"

interface VariantDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  combo: ProductVariantCombination | null
  comboLabel: string
  showIphoneSeminovoFields: boolean
  brandSlug?: string | null
  disabled?: boolean
  onSave: (combo: ProductVariantCombination) => void
}

export function VariantDetailDialog({
  open,
  onOpenChange,
  combo,
  comboLabel,
  showIphoneSeminovoFields,
  brandSlug,
  disabled,
  onSave,
}: VariantDetailDialogProps) {
  const [draft, setDraft] = useState<ProductVariantCombination | null>(combo)
  const [offerItemDraft, setOfferItemDraft] = useState("")

  useEffect(() => {
    if (open && combo) {
      setDraft({ ...combo })
      setOfferItemDraft("")
    }
  }, [open, combo])

  if (!draft) return null

  const update = <K extends keyof ProductVariantCombination>(
    field: K,
    value: ProductVariantCombination[K],
  ) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const addOfferItem = (raw: string) => {
    const value = raw.trim()
    if (!value) return
    setDraft((prev) => {
      if (!prev) return prev
      if (prev.offerItems?.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return prev
      }
      return { ...prev, offerItems: [...(prev.offerItems ?? []), value] }
    })
    setOfferItemDraft("")
  }

  const removeOfferItem = (value: string) => {
    setDraft((prev) =>
      prev
        ? { ...prev, offerItems: (prev.offerItems ?? []).filter((item) => item !== value) }
        : prev,
    )
  }

  const handleGalleryChange = (images: string[], hoverImageUrl?: string | null) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            images,
            image: images[0] ?? "",
            hoverImageUrl: hoverImageUrl ?? null,
          }
        : prev,
    )
  }

  const handleSave = () => {
    if (draft.offerEnabled && (draft.offerItems?.length ?? 0) === 0) return
    onSave(draft)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Detalhes da variante</DialogTitle>
          <DialogDescription className="text-xs">{comboLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-md border border-border/70 p-3">
            <VariantGalleryUpload
              images={draft.images ?? (draft.image ? [draft.image] : [])}
              hoverImageUrl={draft.hoverImageUrl}
              onChange={handleGalleryChange}
              disabled={disabled}
              brandSlug={brandSlug}
            />
          </div>

          {showIphoneSeminovoFields && (
            <div className="rounded-md border border-border/70 bg-muted/20 p-3 space-y-2.5">
              <p className="text-xs font-medium">iPhone seminovo</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
                <div className="flex items-center gap-2 min-h-9">
                  <input
                    type="checkbox"
                    id="variant-semFaceId"
                    checked={draft.semFaceId === true}
                    onChange={(e) => update("semFaceId", e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <Label htmlFor="variant-semFaceId" className="text-xs font-normal cursor-pointer">
                    Sem Face ID
                  </Label>
                </div>
                <Field label="Saúde da bateria (%)" htmlFor="variant-battery">
                  <Input
                    id="variant-battery"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={draft.batteryHealthPercent ?? ""}
                    onChange={(e) => update("batteryHealthPercent", e.target.value)}
                    placeholder="Ex: 87"
                    disabled={disabled}
                    className="h-9"
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="rounded-md border border-border/70 p-3 space-y-3">
            <p className="text-xs font-medium">Desconto</p>
            <div className="max-w-[180px]">
              <Field label="Desconto (%)" htmlFor="variant-discount">
                <Input
                  id="variant-discount"
                  type="number"
                  min={0}
                  max={100}
                  value={draft.discount ?? ""}
                  onChange={(e) => update("discount", e.target.value)}
                  placeholder="0"
                  disabled={disabled}
                  className="h-9"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-md border border-orange-200/80 bg-orange-50/30 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">Pack promocional</p>
                <p className="text-[11px] text-muted-foreground">Faixa laranja na ficha do produto</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.offerEnabled === true}
                onClick={() => update("offerEnabled", !draft.offerEnabled)}
                disabled={disabled}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  draft.offerEnabled ? "bg-orange-500" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    draft.offerEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {draft.offerEnabled && (
              <div className="space-y-2.5">
                <Field label="Título" htmlFor="variant-offer-title">
                  <Input
                    id="variant-offer-title"
                    value={draft.offerTitle ?? "Pack de proteção"}
                    onChange={(e) => update("offerTitle", e.target.value)}
                    disabled={disabled}
                    className="h-9"
                  />
                </Field>
                <Field label="Itens incluídos">
                  <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 min-h-9">
                    {(draft.offerItems ?? []).map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="gap-1 px-2 py-0.5 text-[11px] font-medium"
                      >
                        {item}
                        <button
                          type="button"
                          className="opacity-60 hover:opacity-100"
                          onClick={() => removeOfferItem(item)}
                          disabled={disabled}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    <input
                      type="text"
                      value={offerItemDraft}
                      onChange={(e) => setOfferItemDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault()
                          addOfferItem(offerItemDraft)
                        }
                      }}
                      placeholder="Capa, Película…"
                      disabled={disabled}
                      className="flex-1 min-w-[80px] bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </Field>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={disabled || (draft.offerEnabled === true && (draft.offerItems?.length ?? 0) === 0)}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
