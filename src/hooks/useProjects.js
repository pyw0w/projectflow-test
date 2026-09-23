import { useCallback, useEffect, useState } from 'react'

/**
 * CRUD store for user-created projects (the test "Projects" page).
 * Persisted to localStorage — entries survive a page reload.
 * Private repositories are added manually through the form: the
 * anonymous GitHub API never returns private repos, and this app
 * ships no tokens (see AGENT.md → Known limitations).
 */

const KEY = 'pyw0w:projects:v1'

function readProjects() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string')
  } catch {
    return []
  }
}

function persist(projects) {
  try {
    localStorage.setItem(KEY, JSON.stringify(projects))
  } catch {
    /* quota / private mode — best effort */
  }
}

function makeProject(input) {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    language: input.language?.trim() ?? '',
    url: input.url?.trim() ?? '',
    isPrivate: Boolean(input.isPrivate),
    createdAt: Date.now(),
  }
}

export function useProjects() {
  const [projects, setProjects] = useState(readProjects)

  useEffect(() => {
    persist(projects)
  }, [projects])

  const addProject = useCallback((input) => {
    const project = makeProject(input)
    setProjects((prev) => [project, ...prev])
    return project
  }, [])

  const removeProject = useCallback((id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return { projects, addProject, removeProject }
}
