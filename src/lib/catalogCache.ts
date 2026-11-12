const CACHE_KEY = 'garimpo-catalog-cache-v1'
const RATE_KEY = 'garimpo-discogs-rate-v1'

interface CacheEntry<T> {
  savedAt: number
  ttlMs: number
  data: T
}

interface RateState {
  windowStart: number
  count: number
}

const DEFAULT_TTL = 1000 * 60 * 60 * 12 // 12h
const MAX_REQUESTS_PER_MINUTE = 20

function readCache(): Record<string, CacheEntry<unknown>> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry<unknown>>) : {}
  } catch {
    return {}
  }
}

function writeCache(map: Record<string, CacheEntry<unknown>>): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(map))
}

export function getCached<T>(key: string): T | null {
  const map = readCache()
  const entry = map[key]
  if (!entry) return null
  if (Date.now() - entry.savedAt > entry.ttlMs) {
    delete map[key]
    writeCache(map)
    return null
  }
  return entry.data as T
}

export function setCached<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL,
): void {
  const map = readCache()
  map[key] = { savedAt: Date.now(), ttlMs, data }
  // keep cache bounded
  const keys = Object.keys(map)
  if (keys.length > 80) {
    keys
      .sort((a, b) => (map[a].savedAt ?? 0) - (map[b].savedAt ?? 0))
      .slice(0, keys.length - 80)
      .forEach((k) => delete map[k])
  }
  writeCache(map)
}

export function clearCatalogCache(): void {
  localStorage.removeItem(CACHE_KEY)
}

/** Simple client-side rate gate for Discogs (~60/min official; we stay conservative). */
export function canCallDiscogs(): boolean {
  try {
    const raw = localStorage.getItem(RATE_KEY)
    const state: RateState = raw
      ? (JSON.parse(raw) as RateState)
      : { windowStart: Date.now(), count: 0 }
    if (Date.now() - state.windowStart > 60_000) {
      localStorage.setItem(
        RATE_KEY,
        JSON.stringify({ windowStart: Date.now(), count: 0 }),
      )
      return true
    }
    return state.count < MAX_REQUESTS_PER_MINUTE
  } catch {
    return true
  }
}

export function markDiscogsCall(): void {
  try {
    const raw = localStorage.getItem(RATE_KEY)
    let state: RateState = raw
      ? (JSON.parse(raw) as RateState)
      : { windowStart: Date.now(), count: 0 }
    if (Date.now() - state.windowStart > 60_000) {
      state = { windowStart: Date.now(), count: 0 }
    }
    state.count += 1
    localStorage.setItem(RATE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}
