import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAllRepos, GitHubApiError } from '../api/githubApi'
import { readCache, writeCache } from '../api/cache'

/**
 * Owns the repository list lifecycle:
 *
 *   mount → read localStorage cache (instant render, if present)
 *         → fetch fresh data from GitHub in the background
 *         → on success: update list + write cache
 *         → on failure: keep showing cache if we have it, otherwise ErrorState
 *
 * "Refresh" (manual button) always refetches, ignoring the cache.
 */
export function useRepos() {
  const [repos, setRepos] = useState(() => readCache()?.repos ?? null)
  const [fetchedAt, setFetchedAt] = useState(() => readCache()?.fetchedAt ?? null)
  const [status, setStatus] = useState(() => (repos ? 'ready' : 'loading'))
  const [error, setError] = useState(null)
  const [rateLimit, setRateLimit] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(async ({ background = false } = {}) => {
    if (background) {
      setIsRefreshing(true)
    } else {
      setStatus('loading')
    }
    setError(null)

    try {
      const result = await fetchAllRepos()
      if (!mounted.current) return
      setRepos(result.repos)
      setFetchedAt(Date.now())
      setRateLimit({
        remaining: result.rateLimitRemaining,
        resetAt: result.rateLimitReset,
      })
      setStatus('ready')
      writeCache(result.repos)
    } catch (err) {
      if (!mounted.current) return
      const apiError =
        err instanceof GitHubApiError ? err : new GitHubApiError('Unexpected error.')
      if (apiError.rateLimitRemaining !== null) {
        setRateLimit({ remaining: apiError.rateLimitRemaining, resetAt: apiError.rateLimitReset })
      }
      // Keep showing cached data if available (soft degradation),
      // only surface a blocking error when there is nothing to show.
      if (readCache()) {
        setStatus('ready')
        setError(apiError) // non-blocking: UI shows a warning banner
      } else {
        setStatus('error')
        setError(apiError)
      }
    } finally {
      if (mounted.current) setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    // Cache-first render happens via lazy useState init above;
    // always run a quiet background refresh on mount.
    load({ background: true })
  }, [load])

  const refresh = useCallback(() => load({ background: false }), [load])

  return { repos, status, error, rateLimit, fetchedAt, isRefreshing, refresh }
}
