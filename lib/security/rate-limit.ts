import { NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
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
