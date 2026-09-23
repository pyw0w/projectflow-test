import styles from './SearchBar.module.css'

/**
 * Search input with clear button. Fully controlled — parent owns the query.
 * Filtering happens in the parent against an already-loaded list (no API calls).
 */
export default function SearchBar({ value, onChange, placeholder = 'Search repositories…' }) {
  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.icon}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04Z" />
      </svg>
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label="Search repositories"
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          ×
        </button>
      )}
    </div>
  )
}
