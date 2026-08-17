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
        "relative overflow-hidden rounded-lg border border-border",
        side ? "aspect-[4/5]" : "aspect-[16/9]",
      )}
      style={{
        background:
          "linear-gradient(98deg, #5c54c4 0%, #a8a4e6 28%, #c4b4ee 58%, #e8c4f0 100%)",
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="absolute right-0 top-0 h-full w-[58%] object-contain object-right p-3 drop-shadow-lg"
        />
      ) : (
        <p className="absolute inset-y-0 right-0 flex w-[58%] items-center justify-center text-[11px] text-white/70">
          Sem recorte
        </p>
      )}
      <div className="absolute inset-y-0 left-0 flex w-[52%] flex-col justify-center p-4">
        {subtitle ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85">{subtitle}</p>
        ) : null}
        <p className="mt-1 text-[15px] font-semibold leading-snug text-white drop-shadow-sm">
          {title.trim() || "Título do banner"}
        </p>
        {buttonText?.trim() ? (
          <span className="mt-2 inline-flex h-6 w-fit items-center rounded-md bg-white px-2 text-[11px] font-medium text-zinc-900">
            {buttonText}
          </span>
        ) : null}
      </div>
    </div>
  )
}
