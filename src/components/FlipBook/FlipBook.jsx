import { useState, useCallback, useEffect, useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  animate,
} from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react'
import styles from './FlipBook.module.css'
import {
  FLIP_DURATION, FAST_FLIP_DURATION, EASE,
  KF_TIMES, KF_ROT_Y_FWD, KF_ROT_Y_BWD, KF_ROT_Z, KF_ROT_X, KF_TRANS_Z,
  PERSPECTIVE,
  AUTO_FLIP,
  RIFFLE_DURATION, RIFFLE_STAGGER, RIFFLE_EASE, RIFFLE_TILT_Z,
} from './flipConfig.js'
import useAutoFlip from './useAutoFlip.js'
import { PAGE_IDS } from './FlipBookContext.js'
export { useFlipBook, PAGE_IDS } from './FlipBookContext.js'

// ── FlipBook ──────────────────────────────────────────────────────────────────
export default function FlipBook({ pages, onCurChange, registerGoTo, registerStartRiffle }) {
  // useReducedMotion is used ONLY for purely decorative elements (corner hint).
  // The 3-D flip runs unconditionally — Windows "animation effects off" must not skip it.
  const prefersReducedDecor = useReducedMotion()

  // ── Refs ──────────────────────────────────────────────────────────────────
  const bookRef      = useRef(null)
  const pageRefs     = useRef([])
  const wheelTimer   = useRef(null)
  const touchStart   = useRef(null)
  const flipQueue    = useRef([])
  const isDragRef    = useRef(false)
  const dragRef      = useRef(null)
  const animRef      = useRef(null)
  const curRef       = useRef(0)
  const isFlipRef    = useRef(false)
  const isRiffRef    = useRef(false)

  // ── Core state ────────────────────────────────────────────────────────────
  const [state, setState] = useState(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
    const idx  = PAGE_IDS.indexOf(hash)
    return { cur: idx >= 0 ? idx : 0, flip: null }
  })
  const { cur, flip } = state
  const isFlipping = flip !== null

  const [isRiffling, setIsRiffling] = useState(false)

  // Keep always-current refs for timer callbacks
  useEffect(() => { curRef.current    = cur },        [cur])
  useEffect(() => { isFlipRef.current = isFlipping }, [isFlipping])
  useEffect(() => { isRiffRef.current = isRiffling }, [isRiffling])

  // Sync current page up to shell/context
  useEffect(() => { onCurChange?.(cur) }, [cur, onCurChange])

  const turningIdx = flip ? (flip.dir === 'fwd' ? flip.from : flip.to)   : -1
  const underIdx   = flip ? (flip.dir === 'fwd' ? flip.to   : flip.from) : -1

  // ── Motion values ─────────────────────────────────────────────────────────
  const flipProgress = useMotionValue(0)
  const progressBar  = useMotionValue(0)

  const rotYFwd = useTransform(flipProgress, KF_TIMES, KF_ROT_Y_FWD)
  const rotYBwd = useTransform(flipProgress, KF_TIMES, KF_ROT_Y_BWD)
  const rotZ    = useTransform(flipProgress, KF_TIMES, KF_ROT_Z)
  const rotX    = useTransform(flipProgress, KF_TIMES, KF_ROT_X)
  const transZ  = useTransform(flipProgress, KF_TIMES, KF_TRANS_Z)

  const sweepPct     = useTransform(flipProgress, [0, 0.85], [92, -18])
  const frontSweepBg = useMotionTemplate`linear-gradient(105deg,transparent 0%,transparent calc(${sweepPct}% - 22%),rgba(255,255,255,0.06) calc(${sweepPct}% - 10%),rgba(255,255,255,0.14) ${sweepPct}%,rgba(255,255,255,0.06) calc(${sweepPct}% + 12%),transparent calc(${sweepPct}% + 24%),transparent 100%)`

  const underOpacity  = useTransform(flipProgress, [0, 0.35, 0.65, 1], [0, 0.72, 0.65, 0])
  const underSweepPct = useTransform(flipProgress, [0, 0.5, 1], [0, 55, 6])
  const underShadowBg = useMotionTemplate`linear-gradient(to right,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.3) calc(${underSweepPct}% * 0.45),transparent ${underSweepPct}%)`

  // ── Flip completion ───────────────────────────────────────────────────────
  const completeFlip = useCallback(() => {
    setState(s => {
      if (!s.flip) return s
      const newCur = s.flip.dest
      if (flipQueue.current.length > 0) {
        const next = flipQueue.current.shift()
        if (next !== newCur) {
          const dir = next > newCur ? 'fwd' : 'bwd'
          return { cur: newCur, flip: { from: newCur, to: next, dest: next, dir, duration: FAST_FLIP_DURATION } }
        }
      }
      return { cur: newCur, flip: null }
    })
  }, [])

  // ── goTo ─────────────────────────────────────────────────────────────────
  const goTo = useCallback((target, duration = FLIP_DURATION) => {
    if (target < 0 || target >= pages.length) return
    setState(s => {
      if (target === s.cur) return s
      const from = s.cur
      const step = target > from ? 1 : -1
      const all = []
      for (let i = from + step; i !== target + step; i += step) all.push(i)
      if (!all.length) return s
      if (s.flip) { flipQueue.current = [...all]; return s }
      const [first, ...rest] = all
      flipQueue.current = rest
      const dir = first > from ? 'fwd' : 'bwd'
      return { cur: from, flip: { from, to: first, dest: first, dir, duration: rest.length ? FAST_FLIP_DURATION : duration } }
    })
  }, [pages.length])

  const next = useCallback(() => goTo(curRef.current + 1), [goTo])
  const prev = useCallback(() => goTo(curRef.current - 1), [goTo])

  // ── Riffle ────────────────────────────────────────────────────────────────
  const startRiffle = useCallback(() => {
    if (isFlipRef.current || isRiffRef.current) return
    setIsRiffling(true)
  }, [])

  function onRiffleDone() {
    setIsRiffling(false)
    setState({ cur: 0, flip: null })
  }

  // Register imperative handles for FlipBookShell
  useEffect(() => { registerGoTo?.(goTo) },               [goTo, registerGoTo])             // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { registerStartRiffle?.(startRiffle) }, [startRiffle, registerStartRiffle]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-flip ─────────────────────────────────────────────────────────────
  const { isPaused, manualPaused, onInteraction, togglePause } = useAutoFlip({
    currentPage: cur,
    pageCount:   pages.length,
    busy:        isFlipping || isRiffling,
    goNext:      next,
    startRiffle,
    progressBar: AUTO_FLIP ? progressBar : null,
  })

  // ── Programmatic flip animation ───────────────────────────────────────────
  // NOTE: no prefers-reduced-motion check — 3-D flip runs for everyone.
  useEffect(() => {
    if (!flip) { flipProgress.set(0); return }
    if (isDragRef.current) return

    flipProgress.set(0)
    if (animRef.current) { animRef.current.stop(); animRef.current = null }

    animRef.current = animate(flipProgress, 1, {
      duration: flip.duration,
      ease: EASE,
      onComplete: completeFlip,
    })

    // Safety: if onComplete never fires, force-complete after duration + 500 ms
    const safety = setTimeout(completeFlip, (flip.duration + 0.5) * 1000)

    return () => {
      if (animRef.current) { animRef.current.stop(); animRef.current = null }
      clearTimeout(safety)
    }
  }, [flip]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag-to-flip ──────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === 'touch') return
    if (isFlipRef.current || isRiffRef.current) return
    if (e.target.closest('button,a,input,select,[data-no-swipe]')) return
    const rect = bookRef.current?.getBoundingClientRect()
    if (!rect) return
    const xRatio = (e.clientX - rect.left) / rect.width
    const c = curRef.current
    let dir = null
    if (xRatio >= 0.45 && c < pages.length - 1) dir = 'fwd'
    else if (xRatio < 0.55 && c > 0) dir = 'bwd'
    else return
    const target = dir === 'fwd' ? c + 1 : c - 1
    isDragRef.current = true
    flipProgress.set(0)
    onInteraction()
    setState(s => s.flip ? s : { cur: s.cur, flip: { from: s.cur, to: target, dest: target, dir, duration: FLIP_DURATION } })
    bookRef.current.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, dir, bookWidth: rect.width }
  }, [pages.length, flipProgress, onInteraction])

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current || !isDragRef.current) return
    const { startX, dir, bookWidth } = dragRef.current
    const raw = dir === 'fwd' ? (-(e.clientX - startX)) / (bookWidth * 0.65) : (e.clientX - startX) / (bookWidth * 0.65)
    flipProgress.set(Math.max(0, Math.min(1, raw)))
  }, [flipProgress])

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current || !isDragRef.current) return
    const progress = flipProgress.get()
    isDragRef.current = false
    dragRef.current   = null
    if (animRef.current) { animRef.current.stop(); animRef.current = null }
    if (progress >= 0.35) {
      animRef.current = animate(flipProgress, 1, { type: 'spring', stiffness: 60, damping: 18, onComplete: completeFlip })
    } else {
      animRef.current = animate(flipProgress, 0, { type: 'spring', stiffness: 80, damping: 22,
        onComplete: () => setState(s => s.flip ? { cur: s.cur, flip: null } : s),
      })
    }
  }, [flipProgress, completeFlip])

  // ── URL hash ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = PAGE_IDS[cur]
    if (id) history.replaceState(null, '', `#${id}`)
  }, [cur])

  // ── Expose current page for Playwright tests (dev only) ──────────────────
  useEffect(() => {
    if (import.meta.env.DEV) window.__flipbook = { currentPage: cur }
  }, [cur])

  // ── Video management ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isRiffling) {
      pageRefs.current.forEach(el => el?.querySelectorAll('video').forEach(v => v.pause()))
      return
    }
    const target = flip ? flip.to : cur
    pageRefs.current.forEach((el, i) => {
      if (!el) return
      el.querySelectorAll('video').forEach(v => {
        if (i === target) v.play().catch(() => {})
        else v.pause()
      })
    })
  }, [cur, flip, isRiffling])

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.add('flipbook-active')
    return () => document.body.classList.remove('flipbook-active')
  }, [])

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); onInteraction(); next() }
      if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); onInteraction(); prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onInteraction])

  // ── Mouse wheel ───────────────────────────────────────────────────────────
  useEffect(() => {
    function onWheel(e) {
      e.preventDefault()
      if (wheelTimer.current) return
      onInteraction()
      if (e.deltaY > 0 || e.deltaX > 0) next(); else prev()
      wheelTimer.current = setTimeout(() => { wheelTimer.current = null }, 900)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [next, prev, onInteraction])

  // ── Touch swipe ───────────────────────────────────────────────────────────
  useEffect(() => {
    function onTouchStart(e) {
      if (e.target.closest('canvas') || e.target.closest('[data-no-swipe]')) return
      onInteraction()
      const t = e.touches[0]
      touchStart.current = { x: t.clientX, y: t.clientY }
    }
    function onTouchEnd(e) {
      if (!touchStart.current) return
      const t  = e.changedTouches[0]
      const dx = t.clientX - touchStart.current.x
      const dy = t.clientY - touchStart.current.y
      touchStart.current = null
      if (Math.abs(dx) < 50 || Math.abs(dx) < 1.5 * Math.abs(dy)) return
      if (dx < 0) next(); else prev()
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [next, prev, onInteraction])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
      <div
        ref={bookRef}
        className={styles.book}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className={styles.spine} aria-hidden="true" />

        {/* ── Pages ── */}
        {pages.map((Page, i) => {
          const isTurning = i === turningIdx
          const isUnder   = i === underIdx
          const isCurrent = i === cur && !flip
          const isRiffBg  = isRiffling && i === 0
          const isVisible = isCurrent || isTurning || isUnder || isRiffBg
          const zIndex    = isTurning ? 10 : (isUnder || isCurrent) ? 5 : isRiffBg ? 1 : 0

          return (
            <div
              key={i}
              ref={el => { pageRefs.current[i] = el }}
              className={styles.pageSlot}
              style={{ zIndex, transform: !isVisible ? 'translateX(200vw)' : 'none', transition: 'none' }}
              data-page-index={i}
              aria-hidden={!isVisible || undefined}
            >
              {isTurning && flip ? (
                <div className={styles.perspectiveWrap} style={{ perspective: PERSPECTIVE }}>
                  <motion.div
                    className={styles.flipper}
                    style={{
                      rotateY:    flip.dir === 'fwd' ? rotYFwd : rotYBwd,
                      rotateZ:    rotZ,
                      rotateX:    rotX,
                      translateZ: transZ,
                    }}
                  >
                    <div className={styles.pageFront}>
                      <Page />
                      <motion.div className={styles.lightSweep} style={{ backgroundImage: frontSweepBg }} aria-hidden="true" />
                    </div>
                    <div className={styles.pageBack} aria-hidden="true">
                      <div className={styles.pageBackInner} />
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className={styles.pageFront}>
                  <Page />
                  {isUnder && flip && (
                    <motion.div
                      className={styles.underShadow}
                      style={{ opacity: underOpacity, backgroundImage: underShadowBg }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* ── Riffle overlay ── */}
        {isRiffling && (
          <div className={styles.riffleWrap} aria-hidden="true">
            {RIFFLE_TILT_Z.map((tiltZ, i) => (
              <div key={i} className={styles.rifflePersp} style={{ zIndex: 14 - i }}>
                <motion.div
                  className={styles.riffleCard}
                  style={{ rotateZ: tiltZ }}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: -185 }}
                  transition={{ duration: RIFFLE_DURATION, ease: RIFFLE_EASE, delay: i * RIFFLE_STAGGER }}
                  onAnimationComplete={i === RIFFLE_TILT_Z.length - 1 ? onRiffleDone : undefined}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Corner hint (desktop / hover devices, decorative) ── */}
        {!prefersReducedDecor && !isFlipping && !isRiffling && cur < pages.length - 1 && (
          <button className={styles.cornerHint} onClick={() => { onInteraction(); next() }} aria-label="Turn to next page" />
        )}

        {/* ── Back to cover (desktop) ── */}
        {cur === pages.length - 1 && !isFlipping && !isRiffling && (
          <button className={styles.backToCoverBtn} onClick={startRiffle} aria-label="Back to cover">
            <RotateCcw size={13} />
            <span>Back to cover</span>
          </button>
        )}

        {/* ── Desktop: floating play/pause + prev/next arrows ── */}
        {AUTO_FLIP && (
          <button
            className={`${styles.autoFlipBtn} ${styles.desktopOnly}`}
            onClick={togglePause}
            aria-label={manualPaused ? 'Resume auto flip' : 'Pause auto flip'}
          >
            {manualPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        )}
        {cur > 0 && !isFlipping && !isRiffling && (
          <button className={`${styles.arrow} ${styles.arrowLeft} ${styles.desktopOnly}`} onClick={() => { onInteraction(); prev() }} aria-label="Previous page">
            <ChevronLeft size={22} />
          </button>
        )}
        {cur < pages.length - 1 && !isFlipping && !isRiffling && (
          <button className={`${styles.arrow} ${styles.arrowRight} ${styles.desktopOnly}`} onClick={() => { onInteraction(); next() }} aria-label="Next page">
            <ChevronRight size={22} />
          </button>
        )}

        {/* ── Desktop: page dots ── */}
        <nav className={`${styles.dots} ${styles.desktopOnly}`} aria-label="Page navigation">
          {pages.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === cur ? styles.dotActive : ''}`}
              onClick={() => { onInteraction(); goTo(i, FAST_FLIP_DURATION) }}
              aria-label={`Go to ${PAGE_IDS[i] ?? `page ${i + 1}`}`}
              aria-current={i === cur ? 'page' : undefined}
            />
          ))}
        </nav>

        {/* ── Mobile bottom bar: [ < ]  dots  [ play/pause ]  [ > ] ── */}
        <div className={styles.mobileBar}>
          <button
            className={styles.mobileArrow}
            onClick={() => { onInteraction(); prev() }}
            disabled={cur === 0 || isFlipping || isRiffling}
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>

          <nav className={styles.mobileDots} aria-label="Page navigation">
            {pages.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === cur ? styles.dotActive : ''}`}
                onClick={() => { onInteraction(); goTo(i, FAST_FLIP_DURATION) }}
                aria-label={`Go to ${PAGE_IDS[i] ?? `page ${i + 1}`}`}
                aria-current={i === cur ? 'page' : undefined}
              />
            ))}
          </nav>

          {AUTO_FLIP && (
            <button
              className={styles.mobilePlayPause}
              onClick={togglePause}
              aria-label={manualPaused ? 'Resume auto flip' : 'Pause auto flip'}
            >
              {manualPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}

          <button
            className={styles.mobileArrow}
            onClick={() => { onInteraction(); next() }}
            disabled={cur === pages.length - 1 || isFlipping || isRiffling}
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ── Dwell progress bar ── */}
        {AUTO_FLIP && !isPaused && !isFlipping && !isRiffling && (
          <motion.div className={styles.progressBar} style={{ scaleX: progressBar }} aria-hidden="true" />
        )}
      </div>
  )
}
