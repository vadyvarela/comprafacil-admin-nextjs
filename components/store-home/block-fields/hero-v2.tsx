"use client"

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  isWeeklyDealHref,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"

type Block = Extract<HomeBlock, { type: "heroV2" }>

export function HeroV2Fields({ block, onChange }: BlockFieldsProps<Block>) {
    const slides = block.props.slides
    const patchSlides = (next: typeof slides) =>
      onChange({ ...block, props: { ...block.props, slides: next, sideFeatures: [] } })
    const updateSlide = (index: number, patch: Partial<(typeof slides)[0]>) => {
      patchSlides(slides.map((s, i) => (i === index ? { ...s, ...patch } : s)))
    }
    const trust = block.props.trustItems ?? []
    const patchTrust = (next: typeof trust) =>
      onChange({
        ...block,
        props: { ...block.props, trustItems: next.length ? next : undefined, sideFeatures: [] },
      })
    return (
      <div className="grid gap-4">
        <div className="space-y-1">
          <Label className="text-[10px]">Tema de fundo</Label>
          <Select
            value={block.props.theme ?? "darkOrange"}
            onValueChange={(v) =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  theme: v as NonNullable<(typeof block.props)["theme"]>,
                },
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="darkOrange">Escuro · laranja</SelectItem>
              <SelectItem value="midnightBlue">Meia-noite · azul</SelectItem>
              <SelectItem value="emeraldNight">Noite · esmeralda</SelectItem>
              <SelectItem value="violetDusk">Crepúsculo · violeta</SelectItem>
              <SelectItem value="slateSteel">Aço · ardósia</SelectItem>
              <SelectItem value="oceanTeal">Oceano · teal</SelectItem>
              <SelectItem value="roseNight">Noite · rosa</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Muda o gradiente e a cor de destaque (badge, CTA, headline).
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Autoplay (ms)</Label>
          <Input
            type="number"
            min={3000}
            max={15000}
            step={500}
            className="h-8 w-32 text-xs"
            value={block.props.autoplayMs ?? 6000}
            onChange={(e) =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  autoplayMs: Math.min(15000, Math.max(3000, Number(e.target.value) || 6000)),
                },
              })
            }
          />
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Slides (1–6). Badge + nome do produto no topo. Card direito: preço, stock, garantia.
          CTA aceita `/produto/…` ou `https://…`. WhatsApp usa as settings da loja.
        </p>
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-2"
          >
            <p className="text-[10px] font-semibold sm:col-span-2">Slide {idx + 1}</p>
            <div className="space-y-1">
              <Label className="text-[10px]">Badge</Label>
              <Input
                className="h-8 text-xs"
                value={slide.badge ?? ""}
                placeholder="NOVO"
                onChange={(e) => updateSlide(idx, { badge: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Nome do produto (topo)</Label>
              <Input
                className="h-8 text-xs"
                value={slide.productLabel ?? ""}
                placeholder="iPhone 17 Pro Max"
                onChange={(e) => updateSlide(idx, { productLabel: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">Headline</Label>
              <Input
                className="h-8 text-xs"
                value={slide.headline}
                onChange={(e) => updateSlide(idx, { headline: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">Destaque (cor accent)</Label>
              <Input
                className="h-8 text-xs"
                value={slide.headlineAccent ?? ""}
                onChange={(e) =>
                  updateSlide(idx, { headlineAccent: e.target.value || undefined })
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">Subtítulo</Label>
              <Input
                className="h-8 text-xs"
                value={slide.subtitle ?? ""}
                onChange={(e) => updateSlide(idx, { subtitle: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">CTA primário</Label>
              <Input
                className="h-8 text-xs"
                value={slide.primaryCtaLabel}
                onChange={(e) => updateSlide(idx, { primaryCtaLabel: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Link CTA (produto ou URL)</Label>
              <Input
                className={cn(
                  "h-8 text-xs font-mono",
                  slide.primaryCtaHref?.trim() &&
                    !isWeeklyDealHref(slide.primaryCtaHref)
                    ? "border-destructive/60 focus-visible:ring-destructive/30"
                    : "",
                )}
                placeholder="/produto/… ou https://…"
                value={slide.primaryCtaHref}
                onChange={(e) => {
                  const v = e.target.value.trim()
                  updateSlide(idx, { primaryCtaHref: v || "/produtos" })
                }}
              />
              <p className="text-[10px] text-muted-foreground leading-snug">
                Ex.: /produto/iphone-17-pro-max ou URL completa.
              </p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">CTA WhatsApp (opcional)</Label>
              <Input
                className="h-8 text-xs"
                value={slide.secondaryCtaLabel ?? ""}
                onChange={(e) =>
                  updateSlide(idx, { secondaryCtaLabel: e.target.value || undefined })
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">Imagem URL</Label>
              <Input
                className="h-8 text-xs font-mono"
                value={slide.imageUrl}
                onChange={(e) => updateSlide(idx, { imageUrl: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">Alt da imagem</Label>
              <Input
                className="h-8 text-xs"
                value={slide.imageAlt}
                onChange={(e) => updateSlide(idx, { imageAlt: e.target.value })}
              />
            </div>

            <p className="text-[10px] font-semibold text-foreground sm:col-span-2 pt-1">
              Card de produto (direita)
            </p>
            <div className="space-y-1">
              <Label className="text-[10px]">Prefixo preço</Label>
              <Input
                className="h-8 text-xs"
                value={slide.pricePrefix ?? ""}
                placeholder="A partir de"
                onChange={(e) => updateSlide(idx, { pricePrefix: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Preço</Label>
              <Input
                className="h-8 text-xs"
                value={slide.price ?? ""}
                placeholder="149.900 CVE"
                onChange={(e) => updateSlide(idx, { price: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Stock</Label>
              <Input
                className="h-8 text-xs"
                value={slide.stockLabel ?? ""}
                placeholder="Em stock"
                onChange={(e) => updateSlide(idx, { stockLabel: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Garantia</Label>
              <Input
                className="h-8 text-xs"
                value={slide.warrantyLabel ?? ""}
                placeholder="Garantia de 1 ano"
                onChange={(e) =>
                  updateSlide(idx, { warrantyLabel: e.target.value || undefined })
                }
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
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
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={slides.length >= 6}
          onClick={() =>
            patchSlides([
              ...slides,
              {
                id: `slide-${slides.length + 1}`,
                badge: "NOVO",
                productLabel: "Produto",
                headline: "Tecnologia sem",
                headlineAccent: "complicações.",
                subtitle: "Descrição curta.",
                primaryCtaLabel: "Ver oferta",
                primaryCtaHref: "/produtos",
                secondaryCtaLabel: "Comprar no WhatsApp",
                imageUrl: slides[0]?.imageUrl ?? "",
                imageAlt: "Produto",
                pricePrefix: "A partir de",
                price: "0 CVE",
                stockLabel: "Em stock",
                warrantyLabel: "Garantia de 1 ano",
              },
            ])
          }
        >
          Adicionar slide
        </Button>

        <p className="text-[10px] font-semibold text-foreground pt-1">
          Faixa inferior (0 ou 2–5)
        </p>
        {trust.map((t, idx) => (
          <div
            key={idx}
            className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-2"
          >
            <div className="space-y-1">
              <Label className="text-[10px]">Ícone</Label>
              <Select
                value={t.icon}
                onValueChange={(v) =>
                  patchTrust(
                    trust.map((it, i) =>
                      i === idx ? { ...it, icon: v as typeof t.icon } : it,
                    ),
                  )
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Entrega</SelectItem>
                  <SelectItem value="shield">Garantia</SelectItem>
                  <SelectItem value="pin">Local</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                  <SelectItem value="star">Estrela</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Cor</Label>
              <Select
                value={t.tone}
                onValueChange={(v) =>
                  patchTrust(
                    trust.map((it, i) =>
                      i === idx ? { ...it, tone: v as typeof t.tone } : it,
                    ),
                  )
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Verde</SelectItem>
                  <SelectItem value="blue">Azul</SelectItem>
                  <SelectItem value="orange">Laranja</SelectItem>
                  <SelectItem value="purple">Roxo</SelectItem>
                  <SelectItem value="red">Vermelho</SelectItem>
                  <SelectItem value="yellow">Amarelo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">Título</Label>
              <Input
                className="h-8 text-xs"
                value={t.label}
                onChange={(e) =>
                  patchTrust(
                    trust.map((it, i) =>
                      i === idx ? { ...it, label: e.target.value } : it,
                    ),
                  )
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px]">Subtítulo</Label>
              <Input
                className="h-8 text-xs"
                value={t.sublabel ?? ""}
                onChange={(e) =>
                  patchTrust(
                    trust.map((it, i) =>
                      i === idx ? { ...it, sublabel: e.target.value || undefined } : it,
                    ),
                  )
                }
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => patchTrust(trust.filter((_, i) => i !== idx))}
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={trust.length >= 5}
          onClick={() =>
            patchTrust([
              ...trust,
              {
                icon: "truck" as const,
                tone: "orange" as const,
                label: "Novo item",
                sublabel: "Descrição",
              },
            ])
          }
        >
          Adicionar item da faixa
        </Button>
      </div>
    )
}
