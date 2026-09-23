import { useHashRoute } from './hooks/useHashRoute'
import Nav from './components/Nav'
import RepoSearchPage from './pages/RepoSearchPage'
import ProjectsPage from './pages/ProjectsPage'
import styles from './App.module.css'

/**
 * App shell: safe-area container + top tabs.
 * Routing is hash-based (see useHashRoute) so the static build works
 * on GitHub Pages without server rewrite rules:
 *   `#/`         → RepoSearchPage (default, unchanged behaviour)
 *   `#/projects` → ProjectsPage (test task: list/search/create form)
 */
export default function App() {
  const route = useHashRoute()

  return (
    <div className={styles.app}>
      <Nav active={route} />
      {route === 'projects' ? <ProjectsPage /> : <RepoSearchPage />}
    </div>
  )
}
