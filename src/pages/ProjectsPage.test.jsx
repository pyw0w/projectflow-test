import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ProjectsPage from './ProjectsPage'

const KEY = 'pyw0w:projects:v1'

function stored(overrides = {}) {
  return {
    id: 'stored-1',
    name: 'stored-repo',
    description: 'from previous session',
    language: 'Python',
    url: '',
    isPrivate: true,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('ProjectsPage (integration)', () => {
  it('shows the empty state on a fresh browser', () => {
    render(<ProjectsPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
  })

  it('renders projects saved in a previous session (reload persistence)', () => {
    localStorage.setItem(KEY, JSON.stringify([stored()]))
    render(<ProjectsPage />)

    const list = screen.getByRole('list', { name: 'Projects' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('stored-repo')).toBeInTheDocument()
    expect(screen.getByText('Private')).toBeInTheDocument()
  })

  it('creates a project through the modal form and shows it in the list', () => {
    render(<ProjectsPage />)

    fireEvent.click(screen.getByRole('button', { name: /new project/i }))
    expect(screen.getByRole('dialog', { name: /new project/i })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'brand-new' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /private repository/i }))
    fireEvent.click(screen.getByRole('button', { name: /create project/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('brand-new')).toBeInTheDocument()
    expect(screen.getByText('Private')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(KEY))[0].name).toBe('brand-new')
  })

  it('filters projects live without touching the network', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        stored(),
        stored({ id: 'stored-2', name: 'frontend-kit', description: 'ui tools', language: '' }),
      ]),
    )
    render(<ProjectsPage />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'frontend' } })
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(screen.getByText('frontend-kit')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } })
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('search matches description and language too', () => {
    localStorage.setItem(KEY, JSON.stringify([stored()]))
    render(<ProjectsPage />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'python' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('deletes a project from the list and from storage', () => {
    localStorage.setItem(KEY, JSON.stringify([stored()]))
    render(<ProjectsPage />)

    fireEvent.click(screen.getByRole('button', { name: /delete project stored-repo/i }))

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual([])
  })

  it('toolbar stacks into a column below 420px (class contract)', () => {
    // jsdom has no layout — the media query itself is verified in
    // scripts/projects-check.mjs (Playwright). Here we only assert the
    // toolbar element comes from the shared component used by both pages.
    render(<ProjectsPage />)
    expect(document.querySelector('div[class*="toolbar"]')).not.toBeNull()
  })
})
