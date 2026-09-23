import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorState from './ErrorState'
import { GitHubApiError } from '../api/githubApi'

describe('ErrorState', () => {
  it('renders a generic API failure with a retry button', () => {
    const onRetry = vi.fn()
    render(<ErrorState error={new GitHubApiError('GitHub API error: 500.', { status: 500 })} onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Failed to load repositories/i)).toBeInTheDocument()
    expect(screen.getByText('GitHub API error: 500.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders rate-limit wording and reset time for 403', () => {
    render(
      <ErrorState
        error={
          new GitHubApiError('GitHub API rate limit exceeded.', {
            status: 403,
            rateLimitReset: Date.now() + 3600_000,
          })
        }
        onRetry={() => {}}
      />,
    )
    expect(screen.getByText(/rate limit reached/i)).toBeInTheDocument()
    expect(screen.getByText(/Limit resets at/)).toBeInTheDocument()
  })

  it('never renders a blank box — has a fallback message', () => {
    render(<ErrorState error={null} onRetry={() => {}} />)
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })
})
