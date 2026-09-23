import { describe, expect, it } from 'vitest'
import { clearCache, readCache, writeCache } from './cache'
import { makeRepo } from '../test/mswServer'

describe('localStorage cache', () => {
  it('round-trips repos with a timestamp', () => {
    const repos = [makeRepo({ id: 1 }), makeRepo({ id: 2 })]
    const before = Date.now()
    writeCache(repos)

    const cached = readCache()
    expect(cached.repos).toHaveLength(2)
    expect(cached.fetchedAt).toBeGreaterThanOrEqual(before)
    expect(cached.fetchedAt).toBeLessThanOrEqual(Date.now())
  })

  it('returns null for absent cache', () => {
    expect(readCache()).toBeNull()
  })

  it('returns null for corrupt JSON', () => {
    localStorage.setItem('pyw0w:repos-cache:v1', '{not json')
    expect(readCache()).toBeNull()
  })

  it('returns null for wrong shape', () => {
    localStorage.setItem('pyw0w:repos-cache:v1', JSON.stringify({ foo: 1 }))
    expect(readCache()).toBeNull()
    localStorage.setItem('pyw0w:repos-cache:v1', JSON.stringify({ repos: 'nope', fetchedAt: 1 }))
    expect(readCache()).toBeNull()
  })

  it('clearCache removes the entry', () => {
    writeCache([makeRepo()])
    clearCache()
    expect(readCache()).toBeNull()
  })
})
