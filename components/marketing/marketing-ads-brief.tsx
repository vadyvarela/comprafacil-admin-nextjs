"use client"

import Link from "next/link"
import { Copy, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/utils/toast"
import { cn } from "@/lib/utils"
import type { MarketingAdsBrief } from "@/lib/marketing/ads-brief"

export function MarketingAdsBriefPanel({ brief }: { brief: MarketingAdsBrief }) {
  async function copy(label: string, text: string) {
    if (!text.trim()) {
      showToast.info(`Ainda não há ${label.toLowerCase()}`)
      return
    }
    await navigator.clipboard.writeText(text)
    showToast.success(`${label} copiado`)
  }

  return (
    <section className="rounded-lg border border-border/80 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Brief Meta Ads
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Copia para o Ads Manager. O agente não compra o anúncio.
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            brief.pixelReady
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          {brief.pixelReady ? "Pixel OK" : "Pixel em falta"}
        </Badge>
      </div>

      {!brief.pixelReady ? (
        <p className="mt-2 text-[11px] text-amber-900">
          Define o Meta Pixel em{" "}
          <Link href="/dashboard/settings/store" className="font-medium underline">
            Definições → Loja
          </Link>
          .
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Pixel <span className="font-mono tabular-nums">{brief.metaPixelId}</span>
        </p>
      )}

      <div className="mt-3 space-y-2">
        <CopyRow
          label="Link Facebook (UTM)"
          value={brief.facebookUrl}
          onCopy={() => void copy("Link Facebook", brief.facebookUrl)}
        />
        <CopyRow
          label="Link Instagram (UTM)"
          value={brief.instagramUrl}
          onCopy={() => void copy("Link Instagram", brief.instagramUrl)}
        />
        <CopyRow
          label="Texto Facebook"
          value={brief.facebookPost}
          onCopy={() => void copy("Facebook", brief.facebookPost)}
          multiline
        />
        <CopyRow
          label="Caption Instagram"
          value={brief.instagramCaption}
          onCopy={() => void copy("Instagram", brief.instagramCaption)}
          multiline
        />
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Formatos
        </p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {brief.formats.map((f) => (
            <li
              key={f.id}
              className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground"
            >
              {f.label} · {f.size}
            </li>
          ))}
        </ul>
      </div>

      {brief.imageUrls[0] ? (
        <div className="mt-3 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brief.imageUrls[0]}
            alt=""
            className="h-12 w-12 rounded border border-border object-cover"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => void copy("URL da imagem", brief.imageUrls[0])}
          >
            <Copy className="h-3 w-3" />
            Copiar URL imagem
          </Button>
          <a
            href={brief.imageUrls[0]}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 items-center gap-1 text-[11px] text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir
          </a>
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Gera uma imagem Feed/Stories na secretária para o criativo.
        </p>
      )}

      <ul className="mt-3 space-y-1 border-t border-border pt-3">
        {brief.checklist.map((item) => (
          <li key={item} className="text-[11px] text-muted-foreground">
            · {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function CopyRow({
  label,
  value,
  onCopy,
  multiline,
}: {
  label: string
  value: string
  onCopy: () => void
  multiline?: boolean
}) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/20 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="text-muted-foreground hover:text-foreground"
          aria-label={`Copiar ${label}`}
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>
      <p
        className={cn(
          "mt-1 text-[11px] text-foreground",
          multiline ? "line-clamp-3 whitespace-pre-wrap" : "truncate font-mono",
        )}
      >
        {value.trim() || "—"}
      </p>
    </div>
  )
}
