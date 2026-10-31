import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import styles from './VenueSection.module.css'

export default function VenueSection() {
  const reduced  = useReducedMotion()
  const innerRef = useRef(null)
  const inView   = useInView(innerRef, { once: true, margin: '-60px' })

  const show = inView && !reduced

  return (
    <section id="venue" className={styles.section}>

      {/* ── Background video ── */}
      <div className={styles.videoBg} aria-hidden="true">
        <video
          className={styles.video}
          src="/assets/venue-bg.mp4.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          /* lazy-load: only start loading when near viewport */
          /* (browsers respect preload="none" for lazy, but autoPlay needs metadata) */
        />
        <div className={styles.overlay} />
        <div className={styles.vignette} />
        <div className={styles.topFade} />
      </div>

      {/* ── Gold ornamental frame ── */}
      <div className={styles.ornamentalFrame} aria-hidden="true">
        <OrnamentalCorners />
      </div>

      {/* ── Content ── */}
      <div className={styles.content} ref={innerRef}>

        {/* Eyebrow */}
        <motion.p
          className={styles.eyebrow}
          initial={{ opacity: 0, y: 20 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          You Are Cordially Invited
        </motion.p>

        {/* Main heading */}
        <motion.h2
          className={styles.heading}
          initial={{ opacity: 0, y: 28 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.12 }}
        >
          A Place to Celebrate Love
        </motion.h2>

        {/* Gold rule */}
        <motion.div
          className={styles.rule}
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={show ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.75, delay: 0.22 }}
        >
          <span>✦</span>
        </motion.div>

        {/* Venue card */}
        <motion.div
          className={styles.venueCard}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={show ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.30, ease: [0.22,1,0.36,1] }}
        >
          <h3 className={styles.venueName}>Utsav Banquet Hall</h3>
          <p className={styles.inviteLine}>
            Join us in celebrating the union of Pragati &amp; Gaurav on this joyous occasion.
          </p>
          <p className={styles.venueDate}>15 February 2027</p>
          <a
            href="https://maps.app.goo.gl/mwYA15Hd5SZHnmYE7"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapsBtn}
            aria-label="Get directions to Utsav Banquet Hall on Google Maps (opens in new tab)"
          >
            <MapPin size={18} aria-hidden="true" />
            Get Directions
            <span className={styles.arrow} aria-hidden="true">→</span>
          </a>
        </motion.div>

      </div>
    </section>
  )
}

/* CSS-based corners — no SVG stretching bugs */
function OrnamentalCorners() {
  return (
    <>
      <div className={styles.frameBorder} />
      <div className={`${styles.frameCorner} ${styles.fcTL}`} />
      <div className={`${styles.frameCorner} ${styles.fcTR}`} />
      <div className={`${styles.frameCorner} ${styles.fcBL}`} />
      <div className={`${styles.frameCorner} ${styles.fcBR}`} />
    </>
  )
}
