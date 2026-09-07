"use client"

import {
  Button,
  Input,
  InternalPathField,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"
import type {
  ShoeStoreExploreTile,
} from "./shared"

type Block = Extract<HomeBlock, { type: "shoeStoreExplore" }>

export function ShoeStoreExploreFields({ block, onChange }: BlockFieldsProps<Block>) {
    const tiles = block.props.tiles
    const patchTiles = (next: typeof tiles) => onChange({ ...block, props: { ...block.props, tiles: next } })
    const defaultTile = (): ShoeStoreExploreTile => ({
      id: `tile-${tiles.length + 1}`,
      label: "Nova categoria",
      description: "",
      href: "/produtos",
      span: "half",
      imageUrl:
        "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Categoria",
    })
    return (
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[10px]">Título da secção</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.title}
              onChange={(e) => onChange({ ...block, props: { ...block.props, title: e.target.value } })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Texto «Ver tudo»</Label>
            <Input
              className="h-8 text-xs"
              value={block.props.seeAllLabel}
              onChange={(e) =>
                onChange({ ...block, props: { ...block.props, seeAllLabel: e.target.value } })
              }
            />
          </div>
          <InternalPathField
            label="Destino «Ver tudo»"
            value={block.props.seeAllHref}
            allowEmpty={false}
            placeholder="/produtos"
            onChange={(seeAllHref) =>
              onChange({
                ...block,
                props: { ...block.props, seeAllHref: seeAllHref?.trim() ? seeAllHref : "/produtos" },
              })
            }
          />
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Entre 2 e 6 tiles. Tamanho «hero» = grande (2×2); «half» = metade; «wide» = faixa larga.
        </p>
        <div className="flex flex-col gap-3">
          {tiles.map((tile, idx) => (
            <fieldset
              key={`${tile.id}-${idx}`}
              className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-2"
            >
              <legend className="mb-1 px-1 text-[10px] font-semibold text-foreground">
                Tile {idx + 1}
              </legend>
              <div className="space-y-1">
                <Label className="text-[10px]">Label</Label>
                <Input
                  className="h-8 text-xs"
                  value={tile.label}
                  onChange={(e) =>
                    patchTiles(tiles.map((t, i) => (i === idx ? { ...t, label: e.target.value } : t)))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Descrição</Label>
                <Input
                  className="h-8 text-xs"
                  value={tile.description ?? ""}
                  placeholder="Texto curto sob o título do tile"
                  onChange={(e) =>
                    patchTiles(
                      tiles.map((t, i) => (i === idx ? { ...t, description: e.target.value } : t)),
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Tamanho</Label>
                <Select
                  value={tile.span}
                  onValueChange={(v) =>
                    patchTiles(
                      tiles.map((t, i) =>
                        i === idx ? { ...t, span: v as ShoeStoreExploreTile["span"] } : t
                      )
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero (grande)</SelectItem>
                    <SelectItem value="half">Metade</SelectItem>
                    <SelectItem value="wide">Faixa larga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <InternalPathField
                className="sm:col-span-2"
                label="Destino (path interno)"
                value={tile.href}
                allowEmpty={false}
                placeholder="/produtos"
                onChange={(href) =>
                  patchTiles(
                    tiles.map((t, i) =>
                      i === idx ? { ...t, href: href?.trim() ? href : "/produtos" } : t
                    )
                  )
                }
              />
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Imagem — URL https ou /path</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={tile.imageUrl}
                  onChange={(e) =>
                    patchTiles(tiles.map((t, i) => (i === idx ? { ...t, imageUrl: e.target.value } : t)))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px]">Alt da imagem</Label>
                <Input
                  className="h-8 text-xs"
                  value={tile.imageAlt}
                  onChange={(e) =>
                    patchTiles(tiles.map((t, i) => (i === idx ? { ...t, imageAlt: e.target.value } : t)))
                  }
                />
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  disabled={tiles.length <= 2}
                  onClick={() => patchTiles(tiles.filter((_, i) => i !== idx))}
                >
                  Remover tile
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
          disabled={tiles.length >= 6}
          onClick={() => patchTiles([...tiles, defaultTile()])}
        >
          Adicionar tile
        </Button>
      </div>
    )
}
