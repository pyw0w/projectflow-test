import styles from './LoadMore.module.css'

/**
 * Incremental pagination: reveals the next chunk of the list.
 * Shows "shown/total" so it is clear how much is left.
 */
export default function LoadMore({ shown, total, onNext }) {
  if (shown >= total) return null

  return (
    <div className={styles.wrapper}>
      <span className={styles.counter}>
        {shown} of {total} repositories
      </span>
      <button type="button" className={styles.button} onClick={onNext}>
        Show more
      </button>
    </div>
  )
}
