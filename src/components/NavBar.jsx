import { useState, useEffect, useRef } from 'react'
import { useFlipBook, PAGE_IDS } from './FlipBook/FlipBook'
import styles from './NavBar.module.css'

const LINKS = [
  { href: '#hero',          label: 'Welcome',      pageId: 'hero'          },
  { href: '#couple',        label: 'The Couple',   pageId: 'couple'        },
  { href: '#celebrations',  label: 'Celebrations', pageId: 'celebrations'  },
  { href: '#bigday',        label: 'Big Day',      pageId: 'bigday'        },
  { href: '#venue',         label: 'Venue',        pageId: 'venue'         },
]

export default function NavBar() {
  const [menuOpen, setMenu] = useState(false)
  const navRef = useRef(null)

  const { currentPage, goTo } = useFlipBook()

  // Keep --nav-h in sync with the real rendered navbar height
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const update = () => {
      const h = Math.ceil(nav.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--nav-h', `${h}px`)
      document.documentElement.style.setProperty('--header-height', `${h}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [])

  function handleClick(e, pageId) {
    e.preventDefault()
    setMenu(false)
    const idx = PAGE_IDS.indexOf(pageId)
    if (idx >= 0) goTo(idx, 0.3)
  }

  const activeId = PAGE_IDS[currentPage] ?? 'hero'

  return (
    <nav
      ref={navRef}
      className={styles.nav}
      aria-label="Site navigation"
      style={{ zIndex: 100 }}
    >
      {/* Desktop links */}
      <div className={styles.links}>
        {LINKS.map(l => (
          <a
            key={l.href}
            href={l.href}
            className={`${styles.link} ${activeId === l.pageId ? styles.active : ''}`}
            onClick={e => handleClick(e, l.pageId)}
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
              className={`${styles.drawerLink} ${activeId === l.pageId ? styles.active : ''}`}
              onClick={e => handleClick(e, l.pageId)}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
