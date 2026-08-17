"use client"

import { cn } from "@/lib/utils"

type PreviewChannel = "facebook" | "instagram"

export function MarketingPostPreview({
  siteName,
  imageUrl,
  caption,
  channel,
  onChannel,
}: {
  siteName: string
  imageUrl?: string | null
  caption: string
  channel: PreviewChannel
  onChannel?: (channel: PreviewChannel) => void
}) {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      {onChannel ? (
        <div className="mb-2 flex gap-0.5">
          {(["facebook", "instagram"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChannel(item)}
              className={cn(
                "h-6 rounded-md px-2 text-[11px] font-medium",
                channel === item
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item === "facebook" ? "Facebook" : "Instagram"}
            </button>
          ))}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
            {(siteName.trim()[0] || "T").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold leading-tight">{siteName}</p>
            <p className="text-[10px] text-muted-foreground">
              {channel === "facebook" ? "Patrocinado · Feed" : "Feed"}
            </p>
          </div>
        </div>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="aspect-square w-full object-cover" />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-muted/50 text-[11px] text-muted-foreground">
            Sem imagem
          </div>
        )}
        <div className="px-3 py-2.5">
          <p className="whitespace-pre-wrap text-[12px] leading-relaxed">
            {caption.trim() || "O texto do post aparece aqui."}
          </p>
        </div>
        <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          {channel === "facebook" ? (
            <>
              <span>Gosto</span>
              <span>Comentar</span>
              <span>Partilhar</span>
            </>
          ) : (
            <>
              <span>Gosto</span>
              <span>Comentar</span>
              <span>Guardar</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
