import { useEffect, useRef, useState } from 'react'
import styles from './ProjectForm.module.css'

const INITIAL = {
  name: '',
  description: '',
  language: '',
  url: '',
  isPrivate: false,
}

/**
 * Modal creation form for the Projects page.
 * Fields: name (required), description, language, URL, Private flag.
 * Private repositories are added manually — the anonymous GitHub API
 * does not expose them (no tokens in this app).
 * Closes on Cancel, backdrop click or Escape; validates the name.
 */
export default function ProjectForm({ open, onSubmit, onClose }) {
  const [values, setValues] = useState(INITIAL)
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const nameRef = useRef(null)

  // Reset every time the dialog opens.
  useEffect(() => {
    if (open) {
      setValues(INITIAL)
      setError('')
      nameRef.current?.focus()
    }
  }, [open])

  // Escape closes the dialog.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const set = (field) => (e) =>
    setValues((v) => ({ ...v, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!values.name.trim()) {
      setError('Name is required.')
      nameRef.current?.focus()
      return
    }
    onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
      language: values.language.trim(),
      url: values.url.trim(),
    })
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        ref={dialogRef}
      >
        <header className={styles.header}>
          <h2 id="project-form-title" className={styles.title}>
            New project
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Close form"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            <span className={styles.label}>
              Name <abbr title="required">*</abbr>
            </span>
            <input
              className={styles.input}
              value={values.name}
              onChange={set('name')}
              ref={nameRef}
              placeholder="my-private-repo"
              aria-invalid={Boolean(error)}
            />
          </label>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <label className={styles.field}>
            <span className={styles.label}>Description</span>
            <textarea
              className={styles.textarea}
              value={values.description}
              onChange={set('description')}
              rows={3}
              placeholder="What is this project about?"
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Language</span>
              <input
                className={styles.input}
                value={values.language}
                onChange={set('language')}
                placeholder="TypeScript"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>URL</span>
              <input
                className={styles.input}
                value={values.url}
                onChange={set('url')}
                placeholder="https://github.com/pyw0w/repo"
                inputMode="url"
              />
            </label>
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={values.isPrivate}
              onChange={set('isPrivate')}
            />
            <span>
              Private repository
              <small>Added manually — private repos are not fetched from the API</small>
            </span>
          </label>

          <footer className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submit}>
              Create project
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
