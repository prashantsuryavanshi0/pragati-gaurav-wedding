import { useEffect, useRef, useState } from 'react'
import styles from './MusicPlayer.module.css'

const STORAGE_KEY = 'wedding_music_muted'
const FADE_DURATION = 800 // ms

export default function MusicPlayer({ baseUrl }) {
  const audioRef = useRef(null)
  const fadeRafRef = useRef(null)
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true' }
    catch { return false }
  })
  const [ready, setReady] = useState(false)

  // Create audio element once
  useEffect(() => {
    const audio = new Audio(`${baseUrl}assets/wedding-music-opt.mp3`)
    audio.loop = true
    audio.volume = 0
    audioRef.current = audio

    const handleCanPlay = () => setReady(true)
    audio.addEventListener('canplaythrough', handleCanPlay)
    audio.load()

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay)
      audio.pause()
      audioRef.current = null
    }
  }, [baseUrl])

  // Handle visibility changes — pause when tab hidden, resume when visible
  useEffect(() => {
    const handleVisibility = () => {
      const audio = audioRef.current
      if (!audio || muted) return
      if (document.hidden) {
        fadeVolume(audio, 0, 400)
      } else {
        audio.play().catch(() => {})
        fadeVolume(audio, 1, 400)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [muted])

  // Start/stop based on muted state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !ready) return

    try { localStorage.setItem(STORAGE_KEY, String(muted)) }
    catch {}

    if (muted) {
      fadeVolume(audio, 0, FADE_DURATION, () => audio.pause())
    } else {
      audio.play().catch(() => {})
      fadeVolume(audio, 1, FADE_DURATION)
    }
  }, [muted, ready])

  function fadeVolume(audio, target, duration, onDone) {
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current)
    const start = audio.volume
    const diff = target - start
    const startTime = performance.now()

    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1)
      audio.volume = Math.max(0, Math.min(1, start + diff * t))
      if (t < 1) {
        fadeRafRef.current = requestAnimationFrame(tick)
      } else {
        fadeRafRef.current = null
        onDone?.()
      }
    }
    fadeRafRef.current = requestAnimationFrame(tick)
  }

  return (
    <button
      className={styles.btn}
      aria-label={muted ? 'Unmute wedding music' : 'Mute wedding music'}
      title={muted ? 'Play music' : 'Mute music'}
      onClick={() => setMuted(m => !m)}
    >
      {muted ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  )
}
