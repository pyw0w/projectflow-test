import { LANGUAGE_COLORS } from './RepoCard'
import styles from './ProjectCard.module.css'

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * One user-created project entry. Renders the name as a link only when a
 * URL was provided (private repos often have no public URL), shows a
 * Private badge, language dot, creation date and a delete button.
 */
export default function ProjectCard({ project, onDelete }) {
  const dotColor = LANGUAGE_COLORS[project.language] || 'var(--text-muted)'

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        {project.url ? (
          <a
            className={styles.name}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {project.name}
          </a>
        ) : (
          <span className={styles.namePlain}>{project.name}</span>
        )}
        {project.isPrivate ? (
          <span className={styles.privateBadge}>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M8 1a4 4 0 0 0-4 4v2H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4Zm2.5 6h-5V5a2.5 2.5 0 1 1 5 0v2Z" />
            </svg>
            Private
          </span>
        ) : null}
        <span className={styles.spacer} />
        <button
          type="button"
          className={styles.delete}
          aria-label={`Delete project ${project.name}`}
          onClick={() => onDelete(project.id)}
        >
          ×
        </button>
      </header>

      {project.description ? (
        <p className={styles.description}>{project.description}</p>
      ) : (
        <p className={styles.noDescription}>No description</p>
      )}

      <footer className={styles.meta}>
        {project.language ? (
          <span className={styles.metaItem}>
            <span
              className={styles.dot}
              style={{ backgroundColor: dotColor }}
              aria-hidden="true"
            />
            {project.language}
          </span>
        ) : null}
        <span className={styles.metaItem}>Added {formatDate(project.createdAt)}</span>
      </footer>
    </article>
  )
}
