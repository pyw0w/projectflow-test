import RepoCard from './RepoCard'
import styles from './RepoList.module.css'

/** Renders the filtered+sorted list of RepoCards. */
export default function RepoList({ repos }) {
  return (
    <ul className={styles.list} aria-label="Repositories">
      {repos.map((repo) => (
        <li key={repo.id}>
          <RepoCard repo={repo} />
        </li>
      ))}
    </ul>
  )
}
