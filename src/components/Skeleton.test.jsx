import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Skeleton from './Skeleton'

describe('Skeleton', () => {
  it('renders placeholder cards without real content', () => {
    render(<Skeleton count={3} />)
    const status = screen.getByRole('status', { name: /loading repositories/i })
    expect(status.children).toHaveLength(3)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
