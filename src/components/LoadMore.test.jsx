import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoadMore from './LoadMore'

describe('LoadMore', () => {
  it('shows how many of how many are visible', () => {
    render(<LoadMore shown={20} total={57} onNext={() => {}} />)
    expect(screen.getByText('20 of 57 repositories')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument()
  })

  it('calls onNext on click', () => {
    const onNext = vi.fn()
    render(<LoadMore shown={20} total={40} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /show more/i }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when everything is shown', () => {
    const { container } = render(<LoadMore shown={57} total={57} onNext={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
