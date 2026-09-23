import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useRepos } from './useRepos'
import { readCache, writeCache } from '../api/cache'
import { makeRepo, server } from '../test/mswServer'

describe('useRepos', () => {
  it('loads repos on mount and writes the cache', async () => {
    const { result } = renderHook(() => useRepos())

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.repos).toHaveLength(3)
    expect(result.current.rateLimit.remaining).toBe(55)
    expect(readCache()?.repos).toHaveLength(3)
  })

  it('renders from cache immediately, then refreshes in the background', async () => {
    writeCache([makeRepo({ id: 99, name: 'from-cache' })])

    const { result } = renderHook(() => useRepos())

    // cache-first: data available synchronously, status not blocking
    expect(result.current.repos?.[0]?.name).toBe('from-cache')
    expect(result.current.status).toBe('ready')
    expect(result.current.isRefreshing).toBe(true) // quiet background refresh running

    await waitFor(() => expect(result.current.isRefreshing).toBe(false))
    expect(result.current.repos).toHaveLength(3) // fresh data replaced the cache
    expect(readCache().repos).toHaveLength(3)
  })

  it('keeps showing cached data when the API fails (soft degradation)', async () => {
    writeCache([makeRepo({ id: 7, name: 'cached' })])
    server.use(
      http.get('https://api.github.com/users/pyw0w/repos', () =>
        HttpResponse.text('down', { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useRepos())
    await waitFor(() => expect(result.current.isRefreshing).toBe(false))

    expect(result.current.status).toBe('ready') // no white screen
    expect(result.current.repos[0].name).toBe('cached')
    expect(result.current.error).toBeTruthy() // warning available for the banner
  })

  it('goes to error state when the API fails and there is no cache', async () => {
    server.use(
      http.get('https://api.github.com/users/pyw0w/repos', () =>
        HttpResponse.text('down', { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useRepos())
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error.status).toBe(500)
  })

  it('refresh() refetches and updates rate limit', async () => {
    const { result } = renderHook(() => useRepos())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let remaining = 42
    server.use(
      http.get('https://api.github.com/users/pyw0w/repos', () =>
        HttpResponse.json([makeRepo({ id: 100, name: 'fresh' })], {
          headers: {
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': '1700000000',
          },
        }),
      ),
    )

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.repos).toHaveLength(1)
    expect(result.current.rateLimit.remaining).toBe(42)
  })

  it('surfaces rate-limit exhaustion on the error object', async () => {
    server.use(
      http.get('https://api.github.com/users/pyw0w/repos', () =>
        HttpResponse.json(
          { message: 'rate limited' },
          {
            status: 403,
            headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '1700000000' },
          },
        ),
      ),
    )

    const { result } = renderHook(() => useRepos())
    await waitFor(() => expect(result.current.status).toBe('error'))

    expect(result.current.error.status).toBe(403)
    expect(result.current.rateLimit.remaining).toBe(0)
  })
})
