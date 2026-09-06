import { NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  resetAt: number
}

/**
 * Limitador em memória: o estado é por instância. Com várias réplicas cada uma
 * tem o seu contador, e reinícios limpam tudo. Para limites que precisem de ser
 * globais, é preciso um store partilhado (Redis).
 */
const store = new Map<string, RateLimitEntry>()

/** Teto de memória: evita crescimento sem fim com chaves de alta cardinalidade. */
const MAX_ENTRIES = 20_000
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function dropExpired(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

function cleanup(force = false) {
  const now = Date.now()
  if (!force && now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  dropExpired(now)
}

function enforceCapacity() {
  if (store.size <= MAX_ENTRIES) return
  cleanup(true)
  if (store.size <= MAX_ENTRIES) return
  const byExpiry = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
  const excess = store.size - MAX_ENTRIES
  for (let i = 0; i < excess; i += 1) store.delete(byExpiry[i][0])
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
}

/**
 * Simple in-memory rate limiter keyed by IP.
 * Returns null if under limit, or a 429 NextResponse if exceeded.
 */
export function rateLimit(
  ip: string | null,
  config: RateLimitConfig = DEFAULT_CONFIG
): NextResponse | null {
  cleanup()

  const key = ip ?? "unknown"
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    enforceCapacity()
    return null
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    )
  }

  return null
}
