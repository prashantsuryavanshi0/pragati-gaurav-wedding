/**
 * useAutoFlip — automatic page-turning hook for FlipBook.
 *
 * Design rules:
 *  • ONE setTimeout, scheduled by a single useEffect.
 *  • Callbacks (goNext, startRiffle) accessed via refs — timer never stale.
 *  • Pauses on: pointerdown, touchstart, keydown, wheel.
 *    Does NOT pause on mousemove/hover.
 *  • Two pause modes:
 *      interaction pause → auto-resumes after RESUME_AFTER_IDLE seconds.
 *      manual pause (Play/Pause button) → stays paused until Play is clicked.
 *  • Pauses when browser tab is hidden; resumes when visible (unless manual).
 *  • Starts immediately on mount — no "invitation opened" gate.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { animate } from 'framer-motion'
import { COVER_DWELL, PAGE_DWELL, PAGE_DWELL_OVERRIDES, RESUME_AFTER_IDLE } from './flipConfig.js'

function getDwellMs(pageIdx) {
  if (pageIdx === 0) return COVER_DWELL * 1000
  return (PAGE_DWELL_OVERRIDES[pageIdx] ?? PAGE_DWELL) * 1000
}

export default function useAutoFlip({ currentPage, pageCount, busy, goNext, startRiffle, progressBar }) {
  const [interactionPaused, setInteractionPaused] = useState(false)
  const [manualPaused,      setManualPaused]      = useState(false)

  // Stable refs to callbacks — swapped each render, so the timer never captures a stale version
  const goNextRef       = useRef(goNext)
  const startRiffleRef  = useRef(startRiffle)
  const resumeTimerRef  = useRef(null)
  const progressAnimRef = useRef(null)

  useEffect(() => { goNextRef.current      = goNext      }, [goNext])
  useEffect(() => { startRiffleRef.current = startRiffle }, [startRiffle])

  const isPaused = interactionPaused || manualPaused || busy

  // ── Single dwell timer ────────────────────────────────────────────────────
  useEffect(() => {
    // Stop progress bar whenever effect re-runs
    if (progressAnimRef.current) { progressAnimRef.current.stop(); progressAnimRef.current = null }
    if (progressBar) progressBar.set(0)

    if (isPaused) return

    const ms = getDwellMs(currentPage)

    if (progressBar) {
      progressAnimRef.current = animate(progressBar, 1, { duration: ms / 1000, ease: 'linear' })
    }

    const timer = setTimeout(() => {
      if (currentPage >= pageCount - 1) startRiffleRef.current?.()
      else goNextRef.current?.()
    }, ms)

    return () => {
      clearTimeout(timer)
      if (progressAnimRef.current) { progressAnimRef.current.stop(); progressAnimRef.current = null }
      if (progressBar) progressBar.set(0)
    }
  }, [currentPage, isPaused, pageCount, progressBar])

  // ── Interaction pause (resets on each interaction, auto-resumes after idle) ─
  const onInteraction = useCallback(() => {
    if (manualPaused) return  // don't override manual pause

    if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }

    setInteractionPaused(true)

    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null
      setInteractionPaused(false)
    }, RESUME_AFTER_IDLE * 1000)
  }, [manualPaused])

  // ── Manual Play/Pause ─────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    if (manualPaused) {
      // Resume: clear any pending idle timer and unpause everything
      if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
      setInteractionPaused(false)
      setManualPaused(false)
    } else {
      // Pause: cancel idle timer so it won't auto-resume
      if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
      setManualPaused(true)
    }
  }, [manualPaused])

  // ── Tab visibility ────────────────────────────────────────────────────────
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
        setInteractionPaused(true)
      } else if (!manualPaused) {
        setInteractionPaused(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [manualPaused])

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  return { isPaused, manualPaused, onInteraction, togglePause }
}
