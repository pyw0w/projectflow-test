import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('shows the query that produced no matches', () => {
    render(<EmptyState query="zzz" />)
    expect(screen.getByText(/No repositories found/i)).toBeInTheDocument()
    expect(screen.getByText('zzz')).toBeInTheDocument()
  })

  it('shows a generic hint when there is no query', () => {
    render(<EmptyState query="" />)
    expect(screen.getByText(/no public repositories/i)).toBeInTheDocument()
    expect(screen.queryByText(/Try a different keyword/i)).not.toBeInTheDocument()
  })
})
