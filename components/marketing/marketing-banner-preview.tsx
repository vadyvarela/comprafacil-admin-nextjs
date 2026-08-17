"use client"

import { cn } from "@/lib/utils"

export function MarketingBannerPreview({
  title,
  subtitle,
  buttonText,
  imageUrl,
  position,
}: {
  title: string
  subtitle?: string
  buttonText?: string
  imageUrl?: string | null
  position?: string
}) {
  const side = position === "hero-side"
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-zinc-950",
        side ? "aspect-[4/5]" : "aspect-[16/9]",
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-[11px] text-white/45">Sem imagem</div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/80 via-black/35 to-transparent" />
      <div className="absolute inset-0 flex items-center p-4">
        <div className="max-w-[75%]">
          {subtitle ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">{subtitle}</p>
          ) : null}
          <p className="mt-0.5 text-[15px] font-semibold leading-snug text-white">
            {title.trim() || "Título do banner"}
          </p>
          {buttonText?.trim() ? (
            <span className="mt-2 inline-flex h-6 items-center rounded-md bg-white px-2 text-[11px] font-medium text-zinc-900">
              {buttonText}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
