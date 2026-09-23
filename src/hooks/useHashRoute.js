import { useEffect, useState } from 'react'

export const ROUTES = ['search', 'projects']

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return ROUTES.includes(hash) ? hash : 'search'
}

/**
 * Minimal hash-based routing (no router dependency).
 * `#/` → search page (default), `#/projects` → projects page.
 * Works on GitHub Pages without any server-side rewrite rules.
 */
export function useHashRoute() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
