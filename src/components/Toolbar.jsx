import styles from './Toolbar.module.css'

/**
 * Horizontal toolbar: search + actions on desktop (one row),
 * stacked column below 420px so nothing overlaps on narrow screens.
 * Slot-based: accepts children (SearchBar, SortControl, refresh button).
 */
export default function Toolbar({ children }) {
  return <div className={styles.toolbar}>{children}</div>
}
