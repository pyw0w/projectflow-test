import { useMemo, useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import Toolbar from '../components/Toolbar'
import SearchBar from '../components/SearchBar'
import ProjectCard from '../components/ProjectCard'
import ProjectForm from '../components/ProjectForm'
import EmptyState from '../components/EmptyState'
import styles from './ProjectsPage.module.css'

/** Client-side filter over locally stored projects. */
function matches(project, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    project.name.toLowerCase().includes(q) ||
    project.description.toLowerCase().includes(q) ||
    project.language.toLowerCase().includes(q)
  )
}

/**
 * Test "Projects" page: list of user-created projects (public and private
 * repos added manually), live search, create form in a modal, everything
 * persisted to localStorage. Toolbar reuses the shared component, so the
 * search + button stack into a column below 420px (no overlap).
 */
export default function ProjectsPage() {
  const { projects, addProject, removeProject } = useProjects()
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const visible = useMemo(
    () => projects.filter((p) => matches(p, query)),
    [projects, query],
  )

  const handleSubmit = (values) => {
    addProject(values)
    setFormOpen(false)
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Projects</h1>
            <p className={styles.subtitle}>
              Your own repositories — add public and private ones manually
            </p>
          </div>
          <span className={styles.count} aria-label="Total projects">
            {projects.length}
          </span>
        </div>

        <Toolbar>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search projects…"
          />
          <button
            type="button"
            className={styles.create}
            onClick={() => setFormOpen(true)}
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 3a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 8 3Z" />
            </svg>
            New project
          </button>
        </Toolbar>
      </header>

      <main className={styles.main}>
        {visible.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <ul className={styles.list} aria-label="Projects">
            {visible.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} onDelete={removeProject} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className={styles.footer}>
        Projects are stored locally in your browser (localStorage) · private
        repositories are added manually, never fetched from the API
      </footer>

      <ProjectForm open={formOpen} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />
    </>
  )
}
