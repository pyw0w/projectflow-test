/**
 * localStorage cache for the repository list.
 * Stores payload + timestamp so a repeat visit can render instantly
 * from cache and refresh in the background.
 */

const KEY = 'pyw0w:repos-cache:v1'

/** Read the cache. Returns null when absent, stale-corrupt or wrong shape. */
export function readCache() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.repos) || typeof parsed.fetchedAt !== 'number') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/** Write the cache with the current timestamp. Silently ignores quota errors. */
export function writeCache(repos) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ repos, fetchedAt: Date.now() }),
    )
  } catch {
    /* quota exceeded / private mode — cache is best-effort */
  }
}

export function clearCache() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
