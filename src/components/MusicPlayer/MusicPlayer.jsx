import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './MusicPlayer.module.css'

const STORAGE_KEY = 'wedding-music-muted'
const TARGET_VOL = 0.45
const FADE_DURATION = 2.5  // seconds

export default function MusicPlayer({ baseUrl }) {
  const audioRef      = useRef(null)
  const ctxRef        = useRef(null)
  const gainRef       = useRef(null)
  const sourceRef     = useRef(null)
  const startedRef    = useRef(false)
  const isStartingRef = useRef(false)
  const wasPlayingRef = useRef(false)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })
  const [showHint, setShowHint] = useState(false)

  // ── Web Audio setup ──────────────────────────────────────────────────────
  const setupWebAudio = useCallback(() => {
    if (ctxRef.current || !audioRef.current) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      ctxRef.current = ctx
      const gain = ctx.createGain()
      gain.gain.value = 0
      gainRef.current = gain
      if (!sourceRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current)
        sourceRef.current = source
        source.connect(gain)
      }
      gain.connect(ctx.destination)
    } catch (_) { /* no Web Audio — fall back to audio.volume */ }
  }, [])

  // ── Fade helpers ─────────────────────────────────────────────────────────
  const fadeIn = useCallback(() => {
    const ctx  = ctxRef.current
    const gain = gainRef.current
    if (ctx && gain) {
      ctx.resume().catch(() => {})
      gain.gain.cancelScheduledValues(ctx.currentTime)
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(TARGET_VOL, ctx.currentTime + FADE_DURATION)
    } else if (audioRef.current) {
      const audio = audioRef.current
      audio.volume = 0
      let elapsed = 0
      const iv = setInterval(() => {
        elapsed += 100
        audio.volume = Math.min(TARGET_VOL, (elapsed / (FADE_DURATION * 1000)) * TARGET_VOL)
        if (elapsed >= FADE_DURATION * 1000) clearInterval(iv)
      }, 100)
    }
  }, [])

  const fadeOut = useCallback((onDone) => {
    const ctx  = ctxRef.current
    const gain = gainRef.current
    if (ctx && gain) {
      gain.gain.cancelScheduledValues(ctx.currentTime)
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_DURATION)
      setTimeout(onDone, FADE_DURATION * 1000)
    } else if (audioRef.current) {
      const audio = audioRef.current
      let elapsed = 0
      const startVol = audio.volume
      const iv = setInterval(() => {
        elapsed += 100
        audio.volume = Math.max(0, startVol - (elapsed / (FADE_DURATION * 1000)) * startVol)
        if (elapsed >= FADE_DURATION * 1000) { clearInterval(iv); onDone?.() }
      }, 100)
    } else {
      onDone?.()
    }
  }, [])

  // ── Start music on first user gesture ────────────────────────────────────
  const startMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio || startedRef.current || muted || isStartingRef.current) return
    startedRef.current = true
    isStartingRef.current = true
    setupWebAudio()
    ctxRef.current?.resume().catch(() => {})
    audio.volume = 1
    audio.play().then(() => {
      isStartingRef.current = false
      setPlaying(true)
      wasPlayingRef.current = true
      fadeIn()
    }).catch(() => { isStartingRef.current = false; startedRef.current = false })
  }, [muted, setupWebAudio, fadeIn])

  // First-gesture listener — skip if target is the music button itself
  useEffect(() => {
    const events = ['pointerdown', 'keydown']
    const handler = (e) => {
      if (e.target.closest?.('[data-music-btn]')) return
      startMusic()
      events.forEach(ev => window.removeEventListener(ev, handler))
    }
    events.forEach(ev => window.addEventListener(ev, handler, { passive: true }))
    return () => events.forEach(ev => window.removeEventListener(ev, handler))
  }, [startMusic])

  // "Tap for music" hint — show after 4s if music hasn't started
  useEffect(() => {
    const show = setTimeout(() => {
      if (!startedRef.current && !muted) setShowHint(true)
    }, 4000)
    const hide = setTimeout(() => setShowHint(false), 9000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [muted])

  // Tab visibility — pause immediately (rAF stops in hidden tabs)
  useEffect(() => {
    function onVisibility() {
      const audio = audioRef.current
      if (!audio) return
      if (document.hidden) {
        wasPlayingRef.current = playing
        if (playing) {
          audio.pause()
          setPlaying(false)
        }
      } else {
        if (wasPlayingRef.current && startedRef.current && !muted) {
          setupWebAudio()
          ctxRef.current?.resume().catch(() => {})
          audio.play().then(() => { setPlaying(true); fadeIn() }).catch(() => {})
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [playing, muted, fadeIn, setupWebAudio])

  // ── Toggle button ─────────────────────────────────────────────────────────
  function toggle() {
    if (isStartingRef.current) return
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      fadeOut(() => { audio.pause(); setPlaying(false); wasPlayingRef.current = false })
      setMuted(true)
      try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    } else {
      setMuted(false)
      try { localStorage.setItem(STORAGE_KEY, '0') } catch {}
      setupWebAudio()
      ctxRef.current?.resume().catch(() => {})
      isStartingRef.current = true
      startedRef.current = true
      audio.play().then(() => {
        isStartingRef.current = false
        setPlaying(true)
        wasPlayingRef.current = true
        fadeIn()
      }).catch(() => { isStartingRef.current = false })
    }
    setShowHint(false)
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={`${baseUrl}assets/wedding-music-opt.mp3`}
        loop
        preload="none"
      />
      <button
        className={`${styles.btn}${showHint ? ` ${styles.pulse}` : ''}`}
        onClick={toggle}
        aria-label={playing ? 'Mute music' : 'Play music'}
        data-music-btn
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        )}
      </button>
      {showHint && (
        <div className={styles.hint} aria-live="polite">
          Tap for music ♪
        </div>
      )}
    </>
  )
}
