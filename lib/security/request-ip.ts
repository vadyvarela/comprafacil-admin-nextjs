/**
 * IP do cliente, resistente a falsificação.
 *
 * `x-forwarded-for` é uma cadeia onde cada proxy **acrescenta** ao fim. Um
 * cliente que envie o header já preenchido fica à esquerda; o valor escrito
 * pelo proxy de confiança mais próximo fica à direita. Ler a primeira entrada
 * é ler exactamente o que o atacante controla — bastava rodar o header para
 * contornar qualquer limite.
 *
 * `TRUSTED_PROXY_HOPS` diz quantos proxies de confiança estão à frente da app
 * (Railway/Vercel: 1; com Cloudflare à frente: 2).
 */
const DEFAULT_TRUSTED_HOPS = 1

export function trustedProxyHops(): number {
  const raw = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "", 10)
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_TRUSTED_HOPS
}

export type HeaderReader = (name: string) => string | null | undefined

export function resolveClientIp(getHeader: HeaderReader): string | null {
  const hops = trustedProxyHops()

  // Sem proxy de confiança, nenhum header de IP é fiável.
  if (hops <= 0) return null

  const forwarded = getHeader("x-forwarded-for")
  if (forwarded) {
    const chain = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
    const ip = chain[chain.length - hops]
    if (ip) return ip
    if (chain.length > 0) return chain[0]
  }

  const real = getHeader("x-real-ip")?.trim()
  return real || null
}

/** Conveniência para Route Handlers. */
export function requestIp(request: {
  headers: { get(name: string): string | null }
}): string | null {
  return resolveClientIp((name) => request.headers.get(name))
}
