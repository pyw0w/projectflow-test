import { useEffect, useMemo, useRef, useState } from 'react'
import { useRepos } from '../hooks/useRepos'
import Toolbar from '../components/Toolbar'
import SearchBar from '../components/SearchBar'
import SortControl from '../components/SortControl'
import RepoList from '../components/RepoList'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Skeleton from '../components/Skeleton'
import LoadMore from '../components/LoadMore'
import RateLimitBadge from '../components/RateLimitBadge'
import styles from './RepoSearchPage.module.css'

/** Client-side filter: matches name, description, language, topics. */
function matchesQuery(repo, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    repo.name?.toLowerCase().includes(q) ||
    repo.description?.toLowerCase().includes(q) ||
    repo.language?.toLowerCase().includes(q) ||
    repo.topics?.some((t) => t.toLowerCase().includes(q))
  )
}

const SORTERS = {
  updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  stars: (a, b) => b.stargazers_count - a.stargazers_count,
  name: (a, b) => a.name.localeCompare(b.name),
}

const PAGE_SIZE = 20

export default function RepoSearchPage() {
  const { repos, status, error, rateLimit, isRefreshing, refresh } = useRepos()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('updated')
  const [shown, setShown] = useState(PAGE_SIZE)
  const firstRender = useRef(true)

  const visible = useMemo(() => {
    if (!repos) return []
    return repos.filter((r) => matchesQuery(r, query)).sort(SORTERS[sort])
  }, [repos, query, sort])

  // New query/sort → start from the first page again.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setShown(PAGE_SIZE)
  }, [query, sort])

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Repo Search</h1>
            <p className={styles.subtitle}>
              Public repositories of <strong>pyw0w</strong>
            </p>
          </div>
          <RateLimitBadge rateLimit={rateLimit} />
        </div>

        <Toolbar>
          <SearchBar value={query} onChange={setQuery} />
          <SortControl value={sort} onChange={setSort} />
          <button
            type="button"
            className={styles.refresh}
            onClick={refresh}
            disabled={isRefreshing || status === 'loading'}
            aria-label="Refresh repository list"
          >
            <svg
              viewBox="0 0 16 16"
              width="15"
              height="15"
              fill="currentColor"
              aria-hidden="true"
              className={isRefreshing ? styles.spin : undefined}
            >
              <path d="M8 2a6 6 0 1 0 5.65 8.05.75.75 0 0 1 1.42-.45A7.5 7.5 0 1 1 8 .5c1.66 0 3.18.6 4.34 1.58L11.5 4h4V0l-1.72 1.72A8.96 8.96 0 0 0 8 0a9 9 0 1 0 8.47 12.06.75.75 0 0 1 1.46.3A10.5 10.5 0 1 1 8 0" />
            </svg>
            Refresh
          </button>
        </Toolbar>

        {/* Non-blocking warning when a refresh failed but cache is shown */}
        {error && status === 'ready' ? (
          <p className={styles.warning} role="status">
            {error.message} Showing cached data.
          </p>
        ) : null}
      </header>

      <main className={styles.main}>
        {status === 'loading' ? (
          <Skeleton />
        ) : status === 'error' ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : visible.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <>
            <RepoList repos={visible.slice(0, shown)} />
            <LoadMore
              shown={Math.min(shown, visible.length)}
              total={visible.length}
              onNext={() => setShown((n) => n + PAGE_SIZE)}
            />
          </>
        )}
      </main>

      <footer className={styles.footer}>
        Data from the public GitHub REST API · no tokens, client-side only
      </footer>
    </>
  )
}
