import styles from './Nav.module.css'

const LINKS = [
  { href: '#/', route: 'search', label: 'Repo Search' },
  { href: '#/projects', route: 'projects', label: 'Projects' },
]

/** Top-level tabs between the two pages of the app. */
export default function Nav({ active }) {
  return (
    <nav className={styles.nav} aria-label="Main">
      {LINKS.map((link) => (
        <a
          key={link.route}
          href={link.href}
          className={`${styles.link} ${active === link.route ? styles.active : ''}`}
          aria-current={active === link.route ? 'page' : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}
