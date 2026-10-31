import { useState, useEffect, useRef } from 'react'
import styles from './NavBar.module.css'

const LINKS = [
  { href: '#hero',          label: 'Welcome'      },
  { href: '#couple',        label: 'The Couple'   },
  { href: '#celebrations',  label: 'Celebrations' },
  { href: '#bigday',        label: 'Big Day'      },
  { href: '#venue',         label: 'Venue'        },
]

export default function NavBar() {
  const [solid, setSolid]     = useState(false)
  const [active, setActive]   = useState('hero')
  const [menuOpen, setMenu]   = useState(false)
  const navRef = useRef(null)

  // Keep --nav-h in sync with the real rendered navbar height
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const update = () => {
      const h = nav.getBoundingClientRect().height
      document.documentElement.style.setProperty('--nav-h', `${Math.ceil(h)}px`)
      document.documentElement.style.setProperty('--header-height', `${Math.ceil(h)}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    function onScroll() {
      setSolid(window.scrollY > 60)

      // Determine active section by scroll position
      const ids = LINKS.map(l => l.href.slice(1))
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i])
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(ids[i])
          return
        }
      }
      setActive('hero')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleClick(e, href) {
    e.preventDefault()
    setMenu(false)
    const el = document.querySelector(href)
    if (!el) return
    const navH = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '52'
    )
    const top = el.getBoundingClientRect().top + window.scrollY - navH
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <nav
      ref={navRef}
      className={`${styles.nav} ${solid ? styles.solid : ''}`}
      aria-label="Site navigation"
    >
      {/* Desktop links */}
      <div className={styles.links}>
        {LINKS.map(l => (
          <a
            key={l.href}
            href={l.href}
            className={`${styles.link} ${active === l.href.slice(1) ? styles.active : ''}`}
            onClick={e => handleClick(e, l.href)}
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        className={styles.burger}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenu(v => !v)}
      >
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.drawer}>
          {LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              className={`${styles.drawerLink} ${active === l.href.slice(1) ? styles.active : ''}`}
              onClick={e => handleClick(e, l.href)}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
