"use client"

import { Copy } from "lucide-react"
import { showToast } from "@/lib/utils/toast"
import type { MarketingDesk } from "@/lib/graphql/marketing/types"
import { cn } from "@/lib/utils"

export function MarketingContentBoard({
  desk,
  campaignUrl,
  headline,
  facebookPost,
  instagramCaption,
  whatsappText,
}: {
  desk: MarketingDesk
  campaignUrl: string
  headline?: string | null
  facebookPost?: string | null
  instagramCaption?: string | null
  whatsappText?: string | null
}) {
  const images = desk.latestImages
  const title = headline || desk.weeklyOffer?.headline || "Sem campanha"
  const fb = facebookPost || desk.weeklyOffer?.facebookPost || ""
  const ig = instagramCaption || desk.weeklyOffer?.instagramCaption || ""
  const wa = whatsappText || desk.weeklyOffer?.whatsappText || ""

  async function copy(label: string, text: string) {
    if (!text.trim()) {
      showToast.info("Ainda não há texto")
      return
    }
    await navigator.clipboard.writeText(text)
    showToast.success(`${label} copiado`)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <section className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden max-lg:max-h-[48%] lg:w-[22rem] lg:border-r lg:border-border">
        <div className="shrink-0 border-b border-border px-4 py-2.5">
          <p className="truncate text-[13px] font-medium">{title}</p>
          <p className="text-[12px] text-muted-foreground">Copia e cola no Facebook ou Instagram.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PackRow channel="Facebook" body={fb} onCopy={() => copy("Facebook", fb)} />
          <PackRow channel="Instagram" body={ig} onCopy={() => copy("Instagram", ig)} />
          <PackRow channel="WhatsApp" body={wa} onCopy={() => copy("WhatsApp", wa)} />
          <PackRow channel="Link" body={campaignUrl} onCopy={() => copy("Link", campaignUrl)} mono />
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden max-lg:border-t max-lg:border-border">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-4">
          <p className="text-[13px] font-medium">Imagens</p>
          <span className="text-[11px] tabular-nums text-muted-foreground">{images.length}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {images.length === 0 ? (
            <p className="px-1 py-8 text-[13px] text-muted-foreground">
              Ainda não há imagens. Gera no separador Hoje, painel Imagem.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {images.map((img) => (
                <li key={`${img.url}-${img.createdAt}`} className="overflow-hidden rounded-md border border-border">
                  <a href={img.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                  </a>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] uppercase text-muted-foreground">{img.format}</span>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Abrir
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function PackRow({
  channel,
  body,
  onCopy,
  mono,
}: {
  channel: string
  body: string
  onCopy: () => void
  mono?: boolean
}) {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium">{channel}</p>
        <button type="button" onClick={onCopy} className="text-muted-foreground hover:text-foreground" aria-label={`Copiar ${channel}`}>
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className={cn("mt-1 whitespace-pre-wrap text-[13px] leading-relaxed", mono && "font-mono text-[12px]")}>
        {body.trim() || "—"}
      </p>
    </div>
  )
}
