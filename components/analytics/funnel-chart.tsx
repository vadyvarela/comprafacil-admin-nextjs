import { TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FunnelData, FunnelStepName } from "@/lib/actions/funnel"

const STEP_LABELS: Record<FunnelStepName, { title: string; hint: string }> = {
  page_view: { title: "Visitaram a loja", hint: "Sessões com pelo menos uma página vista" },
  product_view: { title: "Viram um produto", hint: "Abriram a página de um produto" },
  add_to_cart: { title: "Adicionaram ao carrinho", hint: "Clicaram em adicionar ao carrinho" },
  begin_checkout: { title: "Iniciaram o checkout", hint: "Abriram o formulário de compra" },
  purchase: { title: "Compraram", hint: "Pagamento aprovado" },
}

/** Onde a perda costuma ter origem, para orientar a leitura do funil. */
const DROP_HINTS: Partial<Record<FunnelStepName, string>> = {
  product_view: "Visitantes não encontram ou não clicam nos produtos.",
  add_to_cart: "Produto, preço ou confiança não convencem.",
  begin_checkout: "Portes, custos que surgem no fim ou o próprio carrinho.",
  purchase: "Formulário ou pagamento (Vinti4, Visa, 3DS). Ver pagamentos abaixo.",
}

function pct(part: number, whole: number) {
  if (!whole) return 0
  return (part / whole) * 100
}

function formatPct(value: number) {
  return `${value.toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%`
}

type Row = {
  eventName: FunnelStepName
  sessions: number
  ofEntry: number
  fromPrevious: number | null
  lost: number
}

export function buildFunnelRows(steps: FunnelData["steps"]): Row[] {
  const entry = steps[0]?.sessions ?? 0
  return steps.map((step, i) => {
    const previous = i > 0 ? steps[i - 1].sessions : null
    return {
      eventName: step.eventName,
      sessions: step.sessions,
      ofEntry: pct(step.sessions, entry),
      fromPrevious: previous == null ? null : pct(step.sessions, previous),
      lost: previous == null ? 0 : Math.max(previous - step.sessions, 0),
    }
  })
}

/** Passo com a maior perda relativa ao passo anterior. */
export function biggestDrop(rows: Row[]): Row | null {
  let worst: Row | null = null
  for (const row of rows) {
    if (row.fromPrevious == null || row.lost === 0) continue
    if (!worst || row.fromPrevious < (worst.fromPrevious ?? 100)) worst = row
  }
  return worst
}

export function FunnelChart({ steps }: { steps: FunnelData["steps"] }) {
  const rows = buildFunnelRows(steps)
  const entry = rows[0]?.sessions ?? 0
  const worst = biggestDrop(rows)

  if (!entry) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Sem sessões registadas neste período
      </div>
    )
  }

  return (
    <ol className="space-y-1">
      {rows.map((row) => {
        const isWorst = worst?.eventName === row.eventName
        const label = STEP_LABELS[row.eventName]
        return (
          <li key={row.eventName}>
            {row.fromPrevious != null && (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-x-2 gap-y-0.5 py-1.5 pl-3 text-xs",
                  isWorst ? "text-danger-strong" : "text-muted-foreground"
                )}
              >
                <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="tabular-nums">
                  {formatPct(row.fromPrevious)} passaram ·{" "}
                  {row.lost.toLocaleString("pt-PT")} perdidas
                </span>
                {isWorst && (
                  <span className="rounded-sm bg-danger-soft px-1.5 py-0.5 text-[11px] font-semibold">
                    Maior perda
                  </span>
                )}
                {isWorst && DROP_HINTS[row.eventName] && (
                  <span className="basis-full pl-5 text-muted-foreground sm:basis-auto sm:pl-0">
                    {DROP_HINTS[row.eventName]}
                  </span>
                )}
              </div>
            )}
            <div
              className="group rounded-md px-3 py-2 transition-colors hover:bg-muted/40"
              title={`${label.title}: ${row.sessions.toLocaleString("pt-PT")} sessões (${formatPct(row.ofEntry)} das visitas)`}
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{label.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{label.hint}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {row.sessions.toLocaleString("pt-PT")}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatPct(row.ofEntry)}
                  </p>
                </div>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${Math.max(row.ofEntry, row.sessions ? 0.5 : 0)}%` }}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const PAYMENT_STATUS: Record<string, { label: string; tone: "good" | "bad" | "neutral" }> = {
  PS: { label: "Pagos", tone: "good" },
  PF: { label: "Falharam", tone: "bad" },
  PC: { label: "Cancelados", tone: "bad" },
  RPC: { label: "Parados à espera de confirmação", tone: "neutral" },
  RPM: { label: "Sem método de pagamento", tone: "neutral" },
  RA: { label: "À espera de ação (3DS/OTP)", tone: "neutral" },
  PP: { label: "Em processamento", tone: "neutral" },
}

const TONE_BAR = {
  good: "bg-success",
  bad: "bg-danger",
  neutral: "bg-muted-foreground/50",
}

export function FunnelPayments({ payments }: { payments: FunnelData["payments"] }) {
  const total = payments.reduce((sum, p) => sum + p.total, 0)

  if (!total) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
        Sem tentativas de pagamento neste período
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {payments.map((p) => {
        const meta = PAYMENT_STATUS[p.status] ?? { label: p.status, tone: "neutral" as const }
        const share = pct(p.total, total)
        return (
          <li key={p.status} title={`${meta.label}: ${p.total} (${formatPct(share)})`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{meta.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{p.total.toLocaleString("pt-PT")}</span>{" "}
                · {formatPct(share)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", TONE_BAR[meta.tone])}
                style={{ width: `${Math.max(share, 0.5)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const SOURCE_LABELS: Record<string, string> = {
  direto: "Direto / desconhecido",
  facebook: "Facebook",
  fb: "Facebook",
  instagram: "Instagram",
  ig: "Instagram",
  google: "Google",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
}

export function FunnelSources({ sources }: { sources: FunnelData["sources"] }) {
  if (!sources.length) {
    return (
      <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
        Sem dados de origem neste período
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-[11px] font-semibold uppercase text-muted-foreground">
            <th className="px-5 py-2.5 font-semibold">Origem</th>
            <th className="px-3 py-2.5 text-right font-semibold">Sessões</th>
            <th className="px-3 py-2.5 text-right font-semibold">Carrinho</th>
            <th className="px-3 py-2.5 text-right font-semibold">Checkout</th>
            <th className="px-3 py-2.5 text-right font-semibold">Compras</th>
            <th className="px-5 py-2.5 text-right font-semibold">Conversão</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.source} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
              <td className="px-5 py-2.5 text-foreground">{SOURCE_LABELS[s.source] ?? s.source}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{s.sessions.toLocaleString("pt-PT")}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{s.carts.toLocaleString("pt-PT")}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{s.checkouts.toLocaleString("pt-PT")}</td>
              <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                {s.purchases.toLocaleString("pt-PT")}
              </td>
              <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                {formatPct(pct(s.purchases, s.sessions))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { formatPct, pct }
