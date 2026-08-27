"use client"

import { Input } from "@/components/ui/input"
import { Field } from "@/components/products/product-form-layout"
import type { MetaCatalogMetadataInput } from "@/lib/products/meta-catalog-metadata"

type MetaCatalogFieldsProps = {
  value: MetaCatalogMetadataInput
  onChange: (value: MetaCatalogMetadataInput) => void
  idPrefix: string
  disabled?: boolean
}

export function MetaCatalogFields({
  value,
  onChange,
  idPrefix,
  disabled,
}: MetaCatalogFieldsProps) {
  const patch = (partial: Partial<MetaCatalogMetadataInput>) => {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field
        label="Categoria Google"
        htmlFor={`${idPrefix}-google-product-category`}
        hint="Opcional. Ex.: Electronics > Communications > Telephony"
      >
        <Input
          id={`${idPrefix}-google-product-category`}
          value={value.googleProductCategory}
          onChange={(e) => patch({ googleProductCategory: e.target.value })}
          placeholder="Electronics > Communications > Telephony"
          disabled={disabled}
          className="h-9"
        />
      </Field>

      <Field
        label="Tipo de produto"
        htmlFor={`${idPrefix}-product-type`}
        hint="Ajuda a criar conjuntos como Smartphones, Acessórios, Apple."
      >
        <Input
          id={`${idPrefix}-product-type`}
          value={value.productType}
          onChange={(e) => patch({ productType: e.target.value })}
          placeholder="Smartphones"
          disabled={disabled}
          className="h-9"
        />
      </Field>

      <Field label="Cor" htmlFor={`${idPrefix}-color`}>
        <Input
          id={`${idPrefix}-color`}
          value={value.color}
          onChange={(e) => patch({ color: e.target.value })}
          placeholder="Preto"
          disabled={disabled}
          className="h-9"
        />
      </Field>

      <Field label="Tamanho / capacidade" htmlFor={`${idPrefix}-size`}>
        <Input
          id={`${idPrefix}-size`}
          value={value.size}
          onChange={(e) => patch({ size: e.target.value })}
          placeholder="128 GB"
          disabled={disabled}
          className="h-9"
        />
      </Field>

      <div className="sm:col-span-2">
        <Field
          label="Período de promoção"
          htmlFor={`${idPrefix}-sale-price-effective-date`}
          hint="Opcional quando há preço promocional. Formato Meta: 2026-08-01T00:00+00:00/2026-08-31T23:59+00:00"
        >
          <Input
            id={`${idPrefix}-sale-price-effective-date`}
            value={value.salePriceEffectiveDate}
            onChange={(e) => patch({ salePriceEffectiveDate: e.target.value })}
            placeholder="2026-08-01T00:00+00:00/2026-08-31T23:59+00:00"
            disabled={disabled}
            className="h-9 font-mono text-xs"
          />
        </Field>
      </div>
    </div>
  )
}
