import styles from './EmptyState.module.css'

/** Shown when the client-side filter matches nothing. */
export default function EmptyState({ query }) {
  return (
    <div className={styles.empty} role="status">
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className={styles.title}>No repositories found</p>
      {query ? (
        <p className={styles.hint}>
          Nothing matches “<strong>{query}</strong>”. Try a different keyword.
        </p>
      ) : (
        <p className={styles.hint}>This account has no public repositories.</p>
      )}
    </div>
  )
}
