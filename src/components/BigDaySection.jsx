import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import styles from './BigDaySection.module.css'

/* ── Countdown target: 15 Feb 2027 00:00:00 IST (= 2027-02-14 18:30:00 UTC) ── */
const WEDDING_UTC = Date.UTC(2027, 1, 14, 18, 30, 0)

function getTimeLeft() {
  const diff = WEDDING_UTC - Date.now()
  if (diff <= 0) return null
  const totalSec = Math.floor(diff / 1000)
  return {
    days:  Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    mins:  Math.floor((totalSec % 3600)  / 60),
    secs:  totalSec % 60,
  }
}

function pad2(n) { return String(Math.max(0, n)).padStart(2, '0') }

function CountUnit({ value, label, delay = 0, animate }) {
  return (
    <motion.div
      className={styles.unit}
      initial={{ opacity: 0, y: 24 }}
      animate={animate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.glassBox}>
        <div className={styles.glassSheen} aria-hidden="true" />
        <span className={styles.num}>{value}</span>
      </div>
      <span className={styles.unitLabel}>{label}</span>
    </motion.div>
  )
}

export default function BigDaySection() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)
  const reduced  = useReducedMotion()
  const secRef   = useRef(null)
  const inView   = useInView(secRef, { once: true, margin: '-80px' })

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const shouldAnimate = inView && !reduced

  return (
    <section id="bigday" className={styles.section} ref={secRef}>

      {/* ── Video background ── */}
      <div className={styles.videoBg} aria-hidden="true">
        <video
          className={styles.video}
          src="/assets/big-day.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        {/* Maroon tint keeps text readable without hiding the video */}
        <div className={styles.overlay} />
        {/* Edge vignette */}
        <div className={styles.vignette} />
        {/* Subtle gold centre warmth */}
        <div className={styles.centreGlow} />
      </div>

      {/* ── Mandap arch — decorative foreground SVG ── */}
      <div className={styles.archWrap} aria-hidden="true">
        <MandapArch />
      </div>

      {/* ── Main content ── */}
      <div className={styles.content}>

        {/* Eyebrow */}
        <motion.p
          className={styles.eyebrow}
          initial={{ opacity: 0, y: 20 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          Mark Your Calendar
        </motion.p>

        {/* Diyas */}
        <motion.div
          className={styles.luminary}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span>🪔</span><span>💫</span><span>🪔</span>
        </motion.div>

        {/* Shubh Vivah */}
        <motion.h2
          className={styles.shubh}
          initial={{ opacity: 0, y: 24 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.18 }}
        >
          Shubh Vivah
        </motion.h2>

        {/* Date */}
        <motion.p
          className={styles.mainDate}
          initial={{ opacity: 0, y: 20 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, delay: 0.28 }}
        >
          <strong>15 February</strong> 2027
        </motion.p>

        {/* Venue */}
        <motion.p
          className={styles.venueLine}
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : {}}
          transition={{ duration: 0.85, delay: 0.36 }}
        >
          Utsav Banquet Hall
        </motion.p>

        {/* Gold divider */}
        <motion.div
          className={styles.rule}
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={shouldAnimate ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.75, delay: 0.42 }}
        >
          <span>✦</span>
        </motion.div>

        {/* Countdown or wedding-day message */}
        {timeLeft ? (
          <div className={styles.countdown} aria-label="Countdown to the wedding">
            <CountUnit value={String(timeLeft.days)} label="Days"    delay={0.50} animate={shouldAnimate} />
            <CountUnit value={pad2(timeLeft.hours)}  label="Hours"   delay={0.60} animate={shouldAnimate} />
            <CountUnit value={pad2(timeLeft.mins)}   label="Minutes" delay={0.70} animate={shouldAnimate} />
            <CountUnit value={pad2(timeLeft.secs)}   label="Seconds" delay={0.80} animate={shouldAnimate} />
          </div>
        ) : (
          <motion.div
            className={styles.weddingDayMsg}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
          >
            <span className={styles.wdTitle}>Today is the Day! 🌸</span>
            <span className={styles.wdSub}>
              Wishing Pragati &amp; Gaurav a lifetime of love and happiness
            </span>
          </motion.div>
        )}

        {/* Closing quote */}
        <motion.p
          className={styles.quote}
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.95 }}
        >
          "A thousand hearts are celebrating this union with prayers and blessings."
        </motion.p>
      </div>
    </section>
  )
}

/* Mandap arch drawn in SVG — no image needed */
function MandapArch() {
  return (
    <svg
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMax meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.mandapSvg}
    >
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#E8C96B" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <line x1="0" y1="579" x2="800" y2="579" stroke="url(#ag)" strokeWidth="1" />
      <path d="M250 580 L250 270 Q250 80 400 80 Q550 80 550 270 L550 580"
        stroke="url(#ag)" strokeWidth="1.4" />
      <path d="M290 580 L290 310 Q290 148 400 148 Q510 148 510 310 L510 580"
        stroke="url(#ag)" strokeWidth="0.75" />
      <path d="M80 580 L80 400 Q80 280 160 280 Q240 280 240 400 L240 580"
        stroke="url(#ag)" strokeWidth="0.85" />
      <path d="M560 580 L560 400 Q560 280 640 280 Q720 280 720 400 L720 580"
        stroke="url(#ag)" strokeWidth="0.85" />
      {[120,175,230,285,340].map(y => (
        <g key={y}>
          <line x1="246" y1={y} x2="254" y2={y} stroke="url(#ag)" strokeWidth="0.65" />
          <line x1="546" y1={y} x2="554" y2={y} stroke="url(#ag)" strokeWidth="0.65" />
        </g>
      ))}
      <circle cx="400" cy="80" r="9"  stroke="url(#ag)" strokeWidth="1"   fill="none" />
      <circle cx="400" cy="80" r="3.5" fill="#C9A84C" fillOpacity="0.75" />
    </svg>
  )
}
