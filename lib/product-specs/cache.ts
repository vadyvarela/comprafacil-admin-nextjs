const TTL_MS = 24 * 60 * 60 * 1000

type CacheEntry<T> = { value: T; expiresAt: number }

const searchCache = new Map<string, CacheEntry<unknown>>()
const detailCache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(store: Map<string, CacheEntry<unknown>>, key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value as T
}

function setCached<T>(store: Map<string, CacheEntry<unknown>>, key: string, value: T): void {
  store.set(key, { value, expiresAt: Date.now() + TTL_MS })
}

export function getCachedSearch<T>(key: string): T | null {
  return getCached(searchCache, key)
}

export function setCachedSearch<T>(key: string, value: T): void {
  setCached(searchCache, key, value)
}

export function getCachedDetail<T>(deviceId: number): T | null {
  return getCached(detailCache, String(deviceId))
}

export function setCachedDetail<T>(deviceId: number, value: T): void {
  setCached(detailCache, String(deviceId), value)
}
