import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useProjects } from './useProjects'

const KEY = 'pyw0w:projects:v1'

describe('useProjects', () => {
  it('starts empty when there is no stored data', () => {
    const { result } = renderHook(() => useProjects())
    expect(result.current.projects).toEqual([])
  })

  it('addProject prepends a normalized project with id and createdAt', () => {
    const { result } = renderHook(() => useProjects())

    act(() => {
      result.current.addProject({
        name: '  my-repo  ',
        description: 'desc',
        language: 'TypeScript',
        url: 'https://github.com/pyw0w/my-repo',
        isPrivate: true,
      })
    })

    expect(result.current.projects).toHaveLength(1)
    const p = result.current.projects[0]
    expect(p.name).toBe('my-repo') // trimmed
    expect(p.isPrivate).toBe(true)
    expect(typeof p.id).toBe('string')
    expect(p.id.length).toBeGreaterThan(0)
    expect(typeof p.createdAt).toBe('number')
  })

  it('newest project comes first', () => {
    const { result } = renderHook(() => useProjects())
    act(() => {
      result.current.addProject({ name: 'first' })
      result.current.addProject({ name: 'second' })
    })
    expect(result.current.projects.map((p) => p.name)).toEqual(['second', 'first'])
  })

  it('persists to localStorage and survives a remount (page reload)', () => {
    const first = renderHook(() => useProjects())
    act(() => {
      first.result.current.addProject({ name: 'kept', isPrivate: true })
    })
    first.unmount()

    const raw = localStorage.getItem(KEY)
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw)).toHaveLength(1)

    const second = renderHook(() => useProjects())
    expect(second.result.current.projects).toHaveLength(1)
    expect(second.result.current.projects[0].name).toBe('kept')
    expect(second.result.current.projects[0].isPrivate).toBe(true)
  })

  it('removeProject deletes by id and persists the removal', () => {
    const { result } = renderHook(() => useProjects())
    act(() => {
      result.current.addProject({ name: 'gone' })
      result.current.addProject({ name: 'stays' })
    })
    const doomed = result.current.projects.find((p) => p.name === 'gone')

    act(() => {
      result.current.removeProject(doomed.id)
    })

    expect(result.current.projects.map((p) => p.name)).toEqual(['stays'])
    expect(JSON.parse(localStorage.getItem(KEY))).toHaveLength(1)
  })

  it('returns [] for corrupt stored JSON', () => {
    localStorage.setItem(KEY, '{broken')
    const { result } = renderHook(() => useProjects())
    expect(result.current.projects).toEqual([])
  })

  it('filters out malformed entries', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([{ id: 'a', name: 'ok' }, { noId: true }, 'junk', null]),
    )
    const { result } = renderHook(() => useProjects())
    expect(result.current.projects).toEqual([{ id: 'a', name: 'ok' }])
  })
})
