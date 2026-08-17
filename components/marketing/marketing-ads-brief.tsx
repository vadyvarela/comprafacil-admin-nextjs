"use client"

import Link from "next/link"
import { Copy } from "lucide-react"
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
    <div className="space-y-2">
      {!brief.pixelReady ? (
        <p className="text-[11px] text-amber-900">
          Para medir conversões, define o Pixel em{" "}
          <Link href="/dashboard/settings/store" className="font-medium underline">
            Definições → Loja
          </Link>
          .
        </p>
      ) : null}

      <CopyRow
        label="Link Facebook"
        value={brief.facebookUrl}
        onCopy={() => void copy("Link Facebook", brief.facebookUrl)}
      />
      <CopyRow
        label="Link Instagram"
        value={brief.instagramUrl}
        onCopy={() => void copy("Link Instagram", brief.instagramUrl)}
      />
    </div>
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
