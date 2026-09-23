import styles from './Skeleton.module.css'

/** One skeleton card — mirrors RepoCard's shape while the first load runs. */
function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.bar} ${styles.title}`} />
      <div className={`${styles.bar} ${styles.line}`} />
      <div className={`${styles.bar} ${styles.lineShort}`} />
      <div className={styles.footer}>
        <div className={`${styles.bar} ${styles.chip}`} />
        <div className={`${styles.bar} ${styles.chip}`} />
        <div className={`${styles.bar} ${styles.chipWide}`} />
      </div>
    </div>
  )
}

/** Skeleton list shown during the very first load (no cache available). */
export default function Skeleton({ count = 4 }) {
  return (
    <div className={styles.list} role="status" aria-label="Loading repositories">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
