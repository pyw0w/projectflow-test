import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

/** Factory for a GitHub repo payload — only fields the app reads. */
export function makeRepo(overrides = {}) {
  const repo = {
    id: 1,
    name: 'example-repo',
    description: 'An example repository',
    html_url: null,
    language: 'JavaScript',
    topics: ['demo'],
    stargazers_count: 5,
    updated_at: '2024-06-01T12:00:00Z',
    private: false,
    ...overrides,
  }
  if (repo.html_url === null) {
    repo.html_url = `https://github.com/pyw0w/${repo.name}`
  }
  return repo
}

const RATE_HEADERS = {
  'X-RateLimit-Remaining': '55',
  'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
}

/**
 * MSW server with the two endpoints the app uses.
 * Handlers are overridable per-test via server.use(...).
 */
export const server = setupServer(
  http.get('https://api.github.com/users/pyw0w/repos', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')

    // Page 1: two full pages worth is wasteful — return a small first page
    // and an empty second page by default (single-page result).
    const repos =
      page === 1
        ? [
            makeRepo({ id: 1, name: 'alpha', language: 'JavaScript' }),
            makeRepo({ id: 2, name: 'beta', description: 'Python tools', language: 'Python' }),
            makeRepo({ id: 3, name: 'gamma', topics: ['rust-cli'] }),
          ]
        : []

    return HttpResponse.json(repos, { headers: RATE_HEADERS })
  }),
)
