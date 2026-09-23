import styles from './RateLimitBadge.module.css'

/**
 * Shows the remaining anonymous GitHub API quota (60/hour).
 * Turns amber/red as the budget runs low — soft degradation, not an error.
 */
export default function RateLimitBadge({ rateLimit }) {
  if (!rateLimit || rateLimit.remaining === null || rateLimit.remaining === undefined) {
    return null
  }

  const { remaining } = rateLimit
  const level = remaining === 0 ? 'critical' : remaining <= 10 ? 'low' : 'ok'
  const resetLabel = rateLimit.resetAt
    ? new Date(rateLimit.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <span
      className={`${styles.badge} ${styles[level]}`}
      title={
        resetLabel
          ? `Anonymous GitHub API quota: ${remaining}/60 left, resets at ${resetLabel}`
          : `Anonymous GitHub API quota: ${remaining} left`
      }
    >
      <span className={styles.dot} aria-hidden="true" />
      {remaining}/60 API
    </span>
  )
}
