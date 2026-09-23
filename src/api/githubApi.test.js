import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { fetchAllRepos, GitHubApiError } from './githubApi'
import { makeRepo, server } from '../test/mswServer'

describe('fetchAllRepos', () => {
  it('fetches all repos and returns rate-limit info', async () => {
    const result = await fetchAllRepos()

    expect(result.repos).toHaveLength(3)
    expect(result.repos[0].name).toBe('alpha')
    expect(result.rateLimitRemaining).toBe(55)
    expect(result.rateLimitReset).toBeGreaterThan(Date.now())
  })

  it('requests the pyw0w user endpoint with per_page=100', async () => {
    const requested = []
    server.use(
      http.get('https://api.github.com/users/pyw0w/repos', ({ request }) => {
        requested.push(new URL(request.url).searchParams)
        return HttpResponse.json([])
      }),
    )

    await fetchAllRepos()

    expect(requested[0].get('per_page')).toBe('100')
    expect(requested[0].get('page')).toBe('1')
  })

  it('paginates until a short page is returned', async () => {
    let call = 0
    server.use(
      http.get('https://api.github.com/users/pyw0w/repos', ({ request }) => {
        call += 1
        const page = Number(new URL(request.url).searchParams.get('page'))
        if (call === 1) {
          // full page → forces a second request
          return HttpResponse.json(
            Array.from({ length: 100 }, (_, i) => makeRepo({ id: i, name: `repo-${i}` })),
          )
        }
        return HttpResponse.json(page === 2 ? [makeRepo({ id: 101, name: 'last' })] : [])
      }),
    )

    const result = await fetchAllRepos()

    expect(result.repos).toHaveLength(101)
    expect(result.repos.at(-1).name).toBe('last')
    expect(call).toBe(2) // stopped after the short page
  })

  it('throws GitHubApiError with rate-limit details on 403 exhausted quota', async () => {
    server.use(
      http.get('https://api.github.com/users/pyw0w/repos', () =>
        HttpResponse.json(
          { message: 'API rate limit exceeded' },
          {
            status: 403,
            headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '1700000000' },
          },
        ),
      ),
    )

    const err = await fetchAllRepos().catch((e) => e)

    expect(err).toBeInstanceOf(GitHubApiError)
    expect(err.status).toBe(403)
    expect(err.rateLimitRemaining).toBe(0)
    expect(err.message).toMatch(/rate limit/i)
  })

  it('throws GitHubApiError on server errors', async () => {
    server.use(
      http.get('https://api.github.com/users/pyw0w/repos', () =>
        HttpResponse.text('boom', { status: 500 }),
      ),
    )

    const err = await fetchAllRepos().catch((e) => e)
    expect(err).toBeInstanceOf(GitHubApiError)
    expect(err.status).toBe(500)
  })

  it('throws a network-level GitHubApiError when fetch itself fails', async () => {
    server.use(
      http.get('https://api.github.com/users/pyw0w/repos', () =>
        HttpResponse.error(),
      ),
    )

    const err = await fetchAllRepos().catch((e) => e)
    expect(err).toBeInstanceOf(GitHubApiError)
    expect(err.status).toBe(0)
  })
})
