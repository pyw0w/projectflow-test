import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import RepoCard, { LANGUAGE_COLORS } from './RepoCard'
import { makeRepo } from '../test/mswServer'

describe('RepoCard', () => {
  it('renders name as an external link to the repository', () => {
    render(<RepoCard repo={makeRepo({ name: 'my-repo' })} />)
    const link = screen.getByRole('link', { name: 'my-repo' })
    expect(link).toHaveAttribute('href', 'https://github.com/pyw0w/my-repo')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renders description, language, stars and updated date', () => {
    render(
      <RepoCard
        repo={makeRepo({
          description: 'Cool tools',
          language: 'Python',
          stargazers_count: 42,
          updated_at: '2024-03-10T00:00:00Z',
        })}
      />,
    )
    expect(screen.getByText('Cool tools')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText(/Updated Mar 10, 2024/)).toBeInTheDocument()
  })

  it('maps language to its GitHub color', () => {
    render(<RepoCard repo={makeRepo({ language: 'TypeScript' })} />)
    const dot = screen.getByText('TypeScript').querySelector('span')
    expect(dot.style.backgroundColor).toBeTruthy()
    expect(LANGUAGE_COLORS.TypeScript).toBe('#3178c6')
  })

  it('handles missing description and language gracefully', () => {
    render(<RepoCard repo={makeRepo({ description: null, language: null })} />)
    expect(screen.getByText('No description')).toBeInTheDocument()
    expect(screen.queryByText('JavaScript')).not.toBeInTheDocument()
  })

  it('renders topics as chips (max 5)', () => {
    const topics = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    render(<RepoCard repo={makeRepo({ topics })} />)
    topics.slice(0, 5).forEach((t) => expect(screen.getByText(t)).toBeInTheDocument())
    expect(screen.queryByText('f')).not.toBeInTheDocument()
  })

  it('shows a Private badge for private repos', () => {
    render(<RepoCard repo={makeRepo({ private: true })} />)
    expect(screen.getByText('Private')).toBeInTheDocument()
  })
})
