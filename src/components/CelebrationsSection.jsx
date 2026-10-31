import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionVideoBg from './SectionVideoBg'
import styles from './CelebrationsSection.module.css'

const EVENTS = [
  {
    key: 'haldi',
    name: 'Haldi',
    badge: 'Ceremony',
    color: '#5A3500',
    color2: '#2D1A00',
    icon: '🌼',
    desc: 'Blessings of turmeric, laughter and golden joy with family.',
    date: 'Date to be announced',
    time: 'Time to be announced',
    venue: 'Venue to be announced',
  },
  {
    key: 'mehndi',
    name: 'Mehndi',
    badge: 'Ceremony',
    color: '#3A0A2A',
    color2: '#1A051A',
    icon: '🌿',
    desc: 'Intricate patterns of love etched in henna, music and dance.',
    date: 'Date to be announced',
    time: 'Time to be announced',
    venue: 'Venue to be announced',
  },
  {
    key: 'wedding',
    name: 'Wedding',
    badge: 'Main Event',
    color: '#4A1010',
    color2: '#2D0808',
    icon: '🕯️',
    desc: 'Sacred vows under the mandap, sealed for eternity.',
    date: '15 February 2027',
    time: 'Time to be announced',
    venue: 'Utsav Banquet Hall',
    confirmed: true,
  },
  {
    key: 'reception',
    name: 'Reception',
    badge: 'Celebration',
    color: '#1A1A4A',
    color2: '#0A0A2D',
    icon: '✨',
    desc: 'An evening of celebration, elegance and cherished memories.',
    date: 'Date to be announced',
    time: 'Time to be announced',
    venue: 'Venue to be announced',
  },
]

function EventCard({ event, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 52, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.75, delay: index * 0.1, ease: [0.22,1,0.36,1] }}
      whileHover={{ y: -7, transition: { duration: 0.3 } }}
    >
      {/* Corner ornaments */}
      <span className={`${styles.corner} ${styles.cTL}`} />
      <span className={`${styles.corner} ${styles.cTR}`} />
      <span className={`${styles.corner} ${styles.cBL}`} />
      <span className={`${styles.corner} ${styles.cBR}`} />

      {/* Image placeholder */}
      <div
        className={styles.imgWrap}
        style={{ background: `linear-gradient(145deg,${event.color} 0%,${event.color2} 100%)` }}
      >
        <div className={styles.imgPlaceholder}>
          <span className={styles.phIcon}>{event.icon}</span>
          <span className={styles.phLabel}>{event.name} photo</span>
        </div>
        <div className={styles.imgOverlay} />
        <span className={`${styles.badge} ${event.confirmed ? styles.badgeConfirmed : ''}`}>
          {event.badge}
        </span>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.eventName}>{event.name}</h3>
        <ul className={styles.details}>
          <li><span className={styles.dIcon}>📅</span>{event.date}</li>
          <li><span className={styles.dIcon}>⏰</span>{event.time}</li>
          <li><span className={styles.dIcon}>📍</span>{event.venue}</li>
        </ul>
        <p className={styles.desc}>{event.desc}</p>
      </div>
    </motion.div>
  )
}

export default function CelebrationsSection() {
  const headRef = useRef(null)
  const headInView = useInView(headRef, { once: true, margin: '-60px' })

  return (
    <section id="celebrations" className={styles.section}>
      <SectionVideoBg src={`${import.meta.env.BASE_URL}assets/celebrations-bg.mp4`} overlayOpacity={0.52} />
      <div className={styles.bg} aria-hidden="true" />

      <div className={styles.inner}>
        <motion.div
          ref={headRef}
          className={styles.header}
          initial={{ opacity: 0, y: 28 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85 }}
        >
          <p className={styles.eyebrow}>Join Us in the Festivities</p>
          <h2 className={styles.title}>Wedding <em>Celebrations</em></h2>
          <div className={styles.rule}><span>✦</span></div>
        </motion.div>

        <p className={styles.swipeHint} aria-hidden="true">Swipe to explore →</p>

        <div className={styles.grid}>
          {EVENTS.map((ev, i) => (
            <EventCard key={ev.key} event={ev} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
