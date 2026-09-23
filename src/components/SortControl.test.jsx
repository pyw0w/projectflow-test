import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SortControl, { SORT_OPTIONS } from './SortControl'

describe('SortControl', () => {
  it('renders all sort options with the current value selected', () => {
    render(<SortControl value="stars" onChange={() => {}} />)
    const select = screen.getByRole('combobox', { name: /sort repositories/i })
    expect(select).toHaveValue('stars')
    for (const opt of SORT_OPTIONS) {
      expect(screen.getByRole('option', { name: opt.label })).toBeInTheDocument()
    }
  })

  it('emits the chosen sort key', () => {
    const onChange = vi.fn()
    render(<SortControl value="updated" onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'name' } })
    expect(onChange).toHaveBeenCalledWith('name')
  })
})
