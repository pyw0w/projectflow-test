import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import RepoList from './RepoList'
import { makeRepo } from '../test/mswServer'

describe('RepoList', () => {
  it('renders one card per repository with stable keys', () => {
    const repos = [
      makeRepo({ id: 1, name: 'one' }),
      makeRepo({ id: 2, name: 'two' }),
      makeRepo({ id: 3, name: 'three' }),
    ]
    render(<RepoList repos={repos} />)
    const list = screen.getByRole('list', { name: 'Repositories' })
    expect(list.children).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'one' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'three' })).toBeInTheDocument()
  })

  it('renders nothing for an empty list', () => {
    render(<RepoList repos={[]} />)
    expect(screen.queryByRole('list', { name: 'Repositories' }).children).toHaveLength(0)
  })
})
