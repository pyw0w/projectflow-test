import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from './SearchBar'

describe('SearchBar', () => {
  it('renders with placeholder and controlled value', () => {
    render(<SearchBar value="react" onChange={() => {}} />)
    const input = screen.getByRole('searchbox', { name: /search repositories/i })
    expect(input).toHaveValue('react')
  })

  it('calls onChange on every keystroke', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vu' } })
    expect(onChange).toHaveBeenCalledWith('vu')
  })

  it('shows clear button only when there is a query, and clears on click', () => {
    const onChange = vi.fn()
    const { rerender } = render(<SearchBar value="" onChange={onChange} />)
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()

    rerender(<SearchBar value="abc" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
