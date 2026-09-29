import { useEffect, useState } from 'react'
import { scrollToHash } from '../lib/scrollTo.js'

const LINKS = [
  { href: '#projects', label: 'Projects' },
  { href: '#expertise', label: 'Expertise' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

// Visibility of the links is scrubbed by the master film timeline (they arrive
// with the hero). The solid/light state is set on `data-state` by App, which
// React never writes, so re-renders here can't clobber it.
export default function Nav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.documentElement.classList.add('is-menu-open')
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('is-menu-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (e) => {
    setOpen(false)
    scrollToHash(e)
  }

  return (
    <>
      <header className="nav">
        <a className="nav__logo" href="#top" onClick={go}>
          Form &amp; Foundations
          {/* Absolutely positioned, so it never moves the logo seen during the film. */}
          <span className="nav__descriptor nav__reveal">Construction / Architecture / Development</span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((link) => (
            <a className="nav__link nav__reveal" key={link.href} href={link.href} onClick={go}>
              {link.label}
            </a>
          ))}
        </nav>

        <a className="nav__cta nav__reveal" href="#contact" onClick={go}>
          Start a project <span aria-hidden="true">→</span>
        </a>

        <button
          className="nav__toggle nav__reveal"
          type="button"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </header>

      <div className="menu" id="menu" data-open={open} aria-hidden={!open}>
        <nav className="menu__links" aria-label="Mobile">
          {LINKS.map((link, i) => (
            <a key={link.href} href={link.href} onClick={go} tabIndex={open ? 0 : -1}>
              <span className="menu__num">0{i + 1}</span>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="menu__cta" href="#contact" onClick={go} tabIndex={open ? 0 : -1}>
          Start a project <span aria-hidden="true">→</span>
        </a>
      </div>
    </>
  )
}
