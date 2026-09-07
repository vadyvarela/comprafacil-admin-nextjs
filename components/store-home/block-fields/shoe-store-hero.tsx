"use client"

import {
  Button,
  Input,
  InternalPathField,
  Label,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"
import type {
  ShoeStoreHeroSlide,
} from "./shared"

type Block = Extract<HomeBlock, { type: "shoeStoreHero" }>

export function ShoeStoreHeroFields({ block, onChange }: BlockFieldsProps<Block>) {
    const slides = block.props.slides
    const patchSlides = (next: typeof slides) => onChange({ ...block, props: { ...block.props, slides: next } })
    const defaultSlide = (): ShoeStoreHeroSlide => ({
      id: `slide-${slides.length + 1}`,
      imageUrl:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=2000&q=85",
      imageAlt: "Imagem lifestyle",
      imagePosition: "center",
      showOverlay: false,
    })
    return (
      <div className="grid gap-3">
        <div className="space-y-1">
          <Label className="text-[10px]">Autoplay (ms)</Label>
          <Input
            type="number"
            min={3000}
            max={15000}
            step={500}
            className="h-8 w-32 text-xs"
            value={block.props.autoplayMs ?? 5500}
            onChange={(e) =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  autoplayMs: Math.min(15000, Math.max(3000, Number(e.target.value) || 5500)),
                },
              })
            }
          />
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Entre 1 e 6 slides full-bleed. Imagem obrigatória; tag, headline, botão e overlay são opcionais.
        </p>
        <div className="flex flex-col gap-3">
          {slides.map((slide, idx) => (
            <fieldset
              key={`${slide.id}-${idx}`}
              className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-2"
            >
              <legend className="mb-1 px-1 text-[10px] font-semibold text-foreground">
                Slide {idx + 1}
              </legend>
              <div className="space-y-1">
                <Label className="text-[10px]">ID (interno)</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={slide.id}
                  onChange={(e) =>
                    patchSlides(slides.map((s, i) => (i === idx ? { ...s, id: e.target.value } : s)))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Tag (opcional)</Label>
                <Input
                  className="h-8 text-xs"
                  value={slide.tag ?? ""}
                  onChange={(e) =>
                    patchSlides(
                      slides.map((s, i) =>
                        i === idx ? { ...s, tag: e.target.value.trim() || undefined } : s
                      )
                    )
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Headline (opcional)</Label>
                <Input
                  className="h-8 text-xs"
                  value={slide.headline ?? ""}
                  onChange={(e) =>
                    patchSlides(
                      slides.map((s, i) =>
                        i === idx ? { ...s, headline: e.target.value.trim() || undefined } : s
                      )
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Texto do botão (opcional)</Label>
                <Input
                  className="h-8 text-xs"
                  value={slide.ctaLabel ?? ""}
                  onChange={(e) =>
                    patchSlides(
                      slides.map((s, i) =>
                        i === idx ? { ...s, ctaLabel: e.target.value.trim() || undefined } : s
                      )
                    )
                  }
                />
              </div>
              <InternalPathField
                label="Destino (path interno, opcional)"
                value={slide.ctaHref}
                allowEmpty
                allowAnyPath
                placeholder="/produtos"
                onChange={(ctaHref) =>
                  patchSlides(
                    slides.map((s, i) =>
                      i === idx ? { ...s, ctaHref: ctaHref?.trim() || undefined } : s
                    )
                  )
                }
              />
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Imagem — URL https ou /path</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={slide.imageUrl}
                  onChange={(e) =>
                    patchSlides(slides.map((s, i) => (i === idx ? { ...s, imageUrl: e.target.value } : s)))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Alt da imagem</Label>
                <Input
                  className="h-8 text-xs"
                  value={slide.imageAlt}
                  onChange={(e) =>
                    patchSlides(slides.map((s, i) => (i === idx ? { ...s, imageAlt: e.target.value } : s)))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Posição object (opcional)</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  placeholder="center 30%"
                  value={slide.imagePosition ?? ""}
                  onChange={(e) =>
                    patchSlides(
                      slides.map((s, i) =>
                        i === idx ? { ...s, imagePosition: e.target.value || undefined } : s
                      )
                    )
                  }
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id={`slide-${idx}-overlay`}
                  type="checkbox"
                  checked={slide.showOverlay !== false}
                  onChange={(e) =>
                    patchSlides(
                      slides.map((s, i) =>
                        i === idx ? { ...s, showOverlay: e.target.checked } : s
                      )
                    )
                  }
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <Label htmlFor={`slide-${idx}-overlay`} className="text-[10px] text-muted-foreground">
                  Overlay escuro sobre a imagem
                </Label>
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  disabled={slides.length <= 1}
                  onClick={() => patchSlides(slides.filter((_, i) => i !== idx))}
                >
                  Remover slide
                </Button>
              </div>
            </fieldset>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={slides.length >= 6}
          onClick={() => patchSlides([...slides, defaultSlide()])}
        >
          Adicionar slide
        </Button>
      </div>
    )
}
