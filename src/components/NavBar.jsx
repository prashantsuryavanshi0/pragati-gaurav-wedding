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
  const overlayRef = useRef(null)

  const { currentPage, goTo } = useFlipBook()

  // Keep --nav-h in sync with rendered navbar height (0 on mobile)
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

  // Close on Escape key
  useEffect(() => {
    if (!menuOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setMenu(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  function handleClick(e, pageId) {
    e.preventDefault()
    setMenu(false)
    const idx = PAGE_IDS.indexOf(pageId)
    if (idx >= 0) goTo(idx, 0.3)
  }

  const activeId = PAGE_IDS[currentPage] ?? 'hero'

  return (
    <>
      {/* ── Desktop/tablet header bar ── */}
      <nav
        ref={navRef}
        className={styles.nav}
        aria-label="Site navigation"
        style={{ zIndex: 100 }}
      >
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
      </nav>

      {/* ── Mobile floating menu button ── */}
      <button
        className={styles.floatBtn}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu-overlay"
        onClick={() => setMenu(v => !v)}
      >
        {menuOpen ? (
          // X icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <line x1="4" y1="4" x2="16" y2="16" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="4" x2="4" y2="16" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          // Hamburger icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <line x1="3" y1="5"  x2="17" y2="5"  stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="3" y1="10" x2="17" y2="10" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="3" y1="15" x2="17" y2="15" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* ── Mobile full-screen overlay ── */}
      {menuOpen && (
        <div
          id="mobile-menu-overlay"
          ref={overlayRef}
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onClick={e => { if (e.target === overlayRef.current) setMenu(false) }}
        >
          <button className={styles.overlayClose} onClick={() => setMenu(false)} aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <line x1="4" y1="4" x2="18" y2="18" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
              <line x1="18" y1="4" x2="4" y2="18" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className={styles.overlayLinks}>
            {LINKS.map(l => (
              <a
                key={l.href}
                href={l.href}
                className={`${styles.overlayLink} ${activeId === l.pageId ? styles.active : ''}`}
                onClick={e => handleClick(e, l.pageId)}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
