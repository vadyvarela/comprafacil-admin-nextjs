"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PRODUCT_PAGE_CONTENT_WIDTH_OPTIONS,
  PRODUCT_PAGE_GALLERY_THUMBNAIL_OPTIONS,
  type ProductPageLayout,
} from "@/lib/product-page-layout"

type Props = {
  layout: ProductPageLayout
  onChange: (layout: ProductPageLayout) => void
}

export function ProductPageLayoutSection({ layout, onChange }: Props) {
  return (
    <div className="space-y-4 rounded-md border border-border/60 bg-muted/10 p-3">
      <div>
        <p className="text-[13px] font-semibold">Layout da página</p>
        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
          Largura do conteúdo e posição das miniaturas na galeria do produto.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Largura do conteúdo</Label>
          <Select
            value={layout.contentWidth}
            onValueChange={(value) =>
              onChange({
                ...layout,
                contentWidth: value as ProductPageLayout["contentWidth"],
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_PAGE_CONTENT_WIDTH_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px]">Miniaturas da galeria</Label>
          <Select
            value={layout.galleryThumbnails}
            onValueChange={(value) =>
              onChange({
                ...layout,
                galleryThumbnails: value as ProductPageLayout["galleryThumbnails"],
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_PAGE_GALLERY_THUMBNAIL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground leading-snug">
            No telemóvel as miniaturas ficam sempre por baixo.
          </p>
        </div>
      </div>
    </div>
  )
}
