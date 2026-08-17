"use client"

import { Copy } from "lucide-react"
import { showToast } from "@/lib/utils/toast"
import type { MarketingDesk } from "@/lib/graphql/marketing/types"

export function MarketingContentBoard({
  desk,
  campaignUrl,
}: {
  desk: MarketingDesk
  campaignUrl: string
}) {
  const offer = desk.weeklyOffer
  const images = desk.latestImages

  async function copy(label: string, text: string) {
    if (!text.trim()) {
      showToast.info("Ainda não há texto")
      return
    }
    await navigator.clipboard.writeText(text)
    showToast.success(`${label} copiado`)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
      <section className="rounded-lg border border-border/80 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Textos prontos
        </p>
        <h2 className="mt-1 text-sm font-semibold">{offer?.headline || "Ainda sem campanha"}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <PackCard
            channel="Facebook"
            body={offer?.facebookPost ?? ""}
            onCopy={() => copy("Facebook", offer?.facebookPost ?? "")}
          />
          <PackCard
            channel="Instagram"
            body={offer?.instagramCaption ?? ""}
            onCopy={() => copy("Instagram", offer?.instagramCaption ?? "")}
          />
        </div>
        <div className="mt-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold">Link destino</p>
            <button
              type="button"
              onClick={() => void copy("Link", campaignUrl)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 truncate text-[12px] text-foreground">{campaignUrl}</p>
        </div>
      </section>

      <section>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Imagens geradas
        </p>
        {images.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">
            Ainda não há imagens. Gera no separador Hoje.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img) => (
              <li
                key={`${img.url}-${img.createdAt}`}
                className="overflow-hidden rounded-lg border border-border/80 bg-card"
              >
                <a href={img.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                </a>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {img.format}
                  </span>
                  <a
                    href={img.url}
                    download
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Abrir
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function PackCard({
  channel,
  body,
  onCopy,
}: {
  channel: string
  body: string
  onCopy: () => void
}) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold">{channel}</p>
        <button type="button" onClick={onCopy} className="text-muted-foreground hover:text-foreground">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">
        {body.trim() || "—"}
      </p>
    </div>
  )
}
