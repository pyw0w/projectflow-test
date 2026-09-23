import styles from './SortControl.module.css'

export const SORT_OPTIONS = [
  { value: 'updated', label: 'Last updated' },
  { value: 'stars', label: 'Stars' },
  { value: 'name', label: 'Name' },
]

/**
 * Sort selector (a native <select> styled with tokens).
 * Controlled: parent owns the sort key and re-sorts client-side.
 */
export default function SortControl({ value, onChange }) {
  return (
    <label className={styles.wrapper}>
      <span className={styles.label}>Sort</span>
      <select
        className={styles.select}
        value={value}
        aria-label="Sort repositories"
        onChange={(e) => onChange(e.target.value)}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
