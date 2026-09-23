/**
 * GitHub REST API client (unauthenticated, public data).
 * Isolated here so components never talk to the network directly.
 *
 * Anonymous rate limit: 60 requests/hour — we surface the remaining
 * quota via X-RateLimit-Remaining and degrade softly when exhausted.
 */

const API_BASE = 'https://api.github.com'
const USER = 'pyw0w'
const PER_PAGE = 100 // max allowed by GitHub

/** Error carrying GitHub-specific context for the UI layer. */
export class GitHubApiError extends Error {
  constructor(message, { status = 0, rateLimitRemaining = null, rateLimitReset = null } = {}) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
    this.rateLimitRemaining = rateLimitRemaining
    this.rateLimitReset = rateLimitReset
  }
}

function readRateLimit(headers) {
  const remaining = headers.get('X-RateLimit-Remaining')
  const reset = headers.get('X-RateLimit-Reset')
  return {
    rateLimitRemaining: remaining === null ? null : Number(remaining),
    rateLimitReset: reset === null ? null : Number(reset) * 1000, // to ms
  }
}

async function fetchPage(page) {
  const url = `${API_BASE}/users/${USER}/repos?per_page=${PER_PAGE}&page=${page}&sort=updated`

  let response
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
    })
  } catch {
    throw new GitHubApiError('Network error — check your connection.', { status: 0 })
  }

  const rate = readRateLimit(response.headers)

  if (!response.ok) {
    if (response.status === 403 && rate.rateLimitRemaining === 0) {
      throw new GitHubApiError(
        'GitHub API rate limit exceeded (60 requests/hour for anonymous use). Try again later.',
        { status: 403, ...rate },
      )
    }
    throw new GitHubApiError(`GitHub API error: ${response.status} ${response.statusText}.`, {
      status: response.status,
      ...rate,
    })
  }

  const items = await response.json()
  return { items, rate }
}

/**
 * Fetch all public repos of the user with pagination.
 * Stops when a page returns fewer than PER_PAGE items or after 10 pages
 * (1000 repos — GitHub's hard cap for this endpoint).
 *
 * @returns {Promise<{repos: Array, rateLimitRemaining: number|null, rateLimitReset: number|null}>}
 */
export async function fetchAllRepos() {
  const all = []
  let rate = { rateLimitRemaining: null, rateLimitReset: null }
  const MAX_PAGES = 10

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchPage(page)
    rate = result.rate
    all.push(...result.items)
    if (result.items.length < PER_PAGE) break
  }

  return { repos: all, ...rate }
}
