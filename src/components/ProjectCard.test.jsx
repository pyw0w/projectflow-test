import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProjectCard from './ProjectCard'
import { LANGUAGE_COLORS } from './RepoCard'

const base = {
  id: 'p1',
  name: 'my-repo',
  description: 'A project',
  language: 'TypeScript',
  url: 'https://github.com/pyw0w/my-repo',
  isPrivate: false,
  createdAt: Date.now(),
}

describe('ProjectCard', () => {
  it('renders the name as an external link when a URL exists', () => {
    render(<ProjectCard project={base} onDelete={() => {}} />)
    const link = screen.getByRole('link', { name: 'my-repo' })
    expect(link).toHaveAttribute('href', base.url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renders plain text (no link) when URL is missing', () => {
    render(<ProjectCard project={{ ...base, url: '' }} onDelete={() => {}} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('my-repo')).toBeInTheDocument()
  })

  it('shows a Private badge for private projects only', () => {
    const { rerender } = render(<ProjectCard project={base} onDelete={() => {}} />)
    expect(screen.queryByText('Private')).not.toBeInTheDocument()

    rerender(<ProjectCard project={{ ...base, isPrivate: true }} onDelete={() => {}} />)
    expect(screen.getByText('Private')).toBeInTheDocument()
  })

  it('shows the language dot with its GitHub color', () => {
    render(<ProjectCard project={base} onDelete={() => {}} />)
    expect(LANGUAGE_COLORS.TypeScript).toBe('#3178c6')
    const lang = screen.getByText('TypeScript')
    const dot = lang.querySelector('span')
    expect(dot).not.toBeNull()
    expect(dot.style.backgroundColor).toBeTruthy()
  })

  it('renders description or a placeholder', () => {
    const { rerender } = render(<ProjectCard project={base} onDelete={() => {}} />)
    expect(screen.getByText('A project')).toBeInTheDocument()

    rerender(<ProjectCard project={{ ...base, description: '' }} onDelete={() => {}} />)
    expect(screen.getByText('No description')).toBeInTheDocument()
  })

  it('delete button fires onDelete with the project id', () => {
    const onDelete = vi.fn()
    render(<ProjectCard project={base} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /delete project my-repo/i }))
    expect(onDelete).toHaveBeenCalledWith('p1')
  })

  it('shows the creation date', () => {
    render(<ProjectCard project={base} onDelete={() => {}} />)
    expect(screen.getByText(/^Added /)).toBeInTheDocument()
  })
})
