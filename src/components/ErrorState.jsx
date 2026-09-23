import styles from './ErrorState.module.css'

/**
 * Blocking error state (API failure / rate limit with no cache to fall back on).
 * Explains the problem and offers a retry — never a blank screen.
 */
export default function ErrorState({ error, onRetry }) {
  const isRateLimit = error?.status === 403

  return (
    <div className={styles.error} role="alert">
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" aria-hidden="true">
        <path
          d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className={styles.title}>
        {isRateLimit ? 'GitHub API rate limit reached' : 'Failed to load repositories'}
      </p>
      <p className={styles.message}>
        {error?.message || 'Something went wrong while contacting the GitHub API.'}
      </p>
      {isRateLimit && error?.rateLimitReset ? (
        <p className={styles.message}>
          Limit resets at{' '}
          {new Date(error.rateLimitReset).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          .
        </p>
      ) : null}
      <button type="button" className={styles.retry} onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
