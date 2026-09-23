import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mswServer'

/**
 * Node 26 exposes an experimental `localStorage` global getter that yields
 * undefined (without --localstorage-file) and it shadows jsdom's storage.
 * Install a minimal in-memory shim so the cache module is testable.
 */
function installLocalStorage() {
  let usable = false
  try {
    usable = typeof window.localStorage?.getItem === 'function'
  } catch {
    usable = false
  }
  if (usable) return

  const store = new Map()
  const shim = {
    getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => {
      store.set(String(k), String(v))
    },
    removeItem: (k) => {
      store.delete(String(k))
    },
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  }
  Object.defineProperty(window, 'localStorage', { value: shim, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true })
}

installLocalStorage()

afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
})

// Start MSW before all tests: no test may hit the real network.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
