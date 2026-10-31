import { useEffect, useRef } from 'react'
import styles from './SectionVideoBg.module.css'

/**
 * Reusable section video background.
 * Props:
 *   src            — video URL
 *   poster         — optional fallback image URL
 *   overlayOpacity — 0–1, defaults to 0.52
 */
export default function SectionVideoBg({ src, poster, overlayOpacity = 0.52 }) {
  const videoRef  = useRef(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Respect prefers-reduced-motion
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      video.pause()
      return
    }

    // IntersectionObserver — play only while section is visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.05 }
    )

    // Observe the closest section ancestor
    const section = video.closest('section') || video.parentElement?.parentElement
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.bg} aria-hidden="true">
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onError={e => {
          console.error('[SectionVideoBg] failed to load:', e.currentTarget.src)
          e.currentTarget.style.display = 'none'
        }}
      />
      <div
        className={styles.overlay}
        style={{ '--overlay-opacity': overlayOpacity }}
      />
    </div>
  )
}
