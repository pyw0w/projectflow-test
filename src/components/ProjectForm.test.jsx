import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProjectForm from './ProjectForm'

const openProps = (overrides = {}) => ({
  open: true,
  onSubmit: vi.fn(),
  onClose: vi.fn(),
  ...overrides,
})

describe('ProjectForm', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ProjectForm {...openProps({ open: false })} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('exposes a modal dialog with labelled fields', () => {
    render(<ProjectForm {...openProps()} />)
    const dialog = screen.getByRole('dialog', { name: /new project/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^language/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^url/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /private repository/i })).toBeInTheDocument()
  })

  it('blocks submit without a name and shows an error', () => {
    const onSubmit = vi.fn()
    render(<ProjectForm {...openProps({ onSubmit })} />)

    fireEvent.click(screen.getByRole('button', { name: /create project/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i)
  })

  it('submits trimmed values including the private flag', () => {
    const onSubmit = vi.fn()
    render(<ProjectForm {...openProps({ onSubmit })} />)

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: '  my-secret  ' },
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'internal tool' },
    })
    fireEvent.change(screen.getByLabelText(/^language/i), { target: { value: 'Go' } })
    fireEvent.change(screen.getByLabelText(/^url/i), { target: { value: 'https://x.y/z' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /private repository/i }))
    fireEvent.click(screen.getByRole('button', { name: /create project/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'my-secret',
      description: 'internal tool',
      language: 'Go',
      url: 'https://x.y/z',
      isPrivate: true,
    })
  })

  it('closes via Cancel, close button, Escape and backdrop click', () => {
    const onClose = vi.fn()
    const { container } = render(<ProjectForm {...openProps({ onClose })} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    fireEvent.click(screen.getByRole('button', { name: /close form/i }))
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.mouseDown(container.querySelector('[class*="backdrop"]'))

    expect(onClose).toHaveBeenCalledTimes(4)
  })

  it('resets values when reopened after a cancelled edit', () => {
    const { rerender } = render(<ProjectForm {...openProps({ open: false })} />)
    rerender(<ProjectForm {...openProps({ open: true })} />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'temp' } })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    rerender(<ProjectForm {...openProps({ open: false })} />)
    rerender(<ProjectForm {...openProps({ open: true })} />)

    expect(screen.getByLabelText(/name/i)).toHaveValue('')
  })
})
