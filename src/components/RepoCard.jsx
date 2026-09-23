import styles from './RepoCard.module.css'

/** GitHub language → dot color (subset covering this account's repos). */
export const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Lua: '#000080',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Single repository card: name (link), description, language dot,
 * stars and last-updated date as secondary text, topics as chips.
 */
export default function RepoCard({ repo }) {
  const dotColor = LANGUAGE_COLORS[repo.language] || 'var(--text-muted)'

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <a
          className={styles.name}
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {repo.name}
        </a>
        {repo.private ? <span className={styles.badge}>Private</span> : null}
      </header>

      {repo.description ? (
        <p className={styles.description}>{repo.description}</p>
      ) : (
        <p className={styles.noDescription}>No description</p>
      )}

      {repo.topics?.length ? (
        <ul className={styles.topics} aria-label="Topics">
          {repo.topics.slice(0, 5).map((topic) => (
            <li key={topic} className={styles.topic}>
              {topic}
            </li>
          ))}
        </ul>
      ) : null}

      <footer className={styles.meta}>
        {repo.language ? (
          <span className={styles.metaItem}>
            <span
              className={styles.languageDot}
              style={{ backgroundColor: dotColor }}
              aria-hidden="true"
            />
            {repo.language}
          </span>
        ) : null}

        <span className={styles.metaItem} title="Stars">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.76 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
          </svg>
          {repo.stargazers_count}
        </span>

        <span className={styles.metaSpacer} />

        <span className={styles.metaItem} title={`Updated ${formatDate(repo.updated_at)}`}>
          Updated {formatDate(repo.updated_at)}
        </span>
      </footer>
    </article>
  )
}
