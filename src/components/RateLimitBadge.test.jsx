import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import RateLimitBadge from './RateLimitBadge'

describe('RateLimitBadge', () => {
  it('renders nothing without rate-limit data', () => {
    const { container } = render(<RateLimitBadge rateLimit={null} />)
    expect(container).toBeEmptyDOMElement()
    render(<RateLimitBadge rateLimit={{ remaining: null }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the remaining quota', () => {
    render(<RateLimitBadge rateLimit={{ remaining: 55, resetAt: Date.now() + 1000 }} />)
    expect(screen.getByText('55/60 API')).toBeInTheDocument()
  })

  it('flags low quota visually', () => {
    render(<RateLimitBadge rateLimit={{ remaining: 3, resetAt: null }} />)
    const badge = screen.getByText('3/60 API')
    expect(badge.className).toMatch(/low/)
  })

  it('flags exhausted quota as critical', () => {
    render(<RateLimitBadge rateLimit={{ remaining: 0, resetAt: null }} />)
    expect(screen.getByText('0/60 API').className).toMatch(/critical/)
  })
})
