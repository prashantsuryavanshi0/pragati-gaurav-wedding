import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import GoldParticles from './GoldParticles'
import RosePetals from './RosePetals'
import Envelope from './Envelope'
import { useFlipBook } from './FlipBook/FlipBook'
import styles from './HeroSection.module.css'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
}
const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 1.0 } },
}
const scaleIn = {
  hidden: { opacity: 0, scale: 0.84 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.95, ease: [0.34, 1.56, 0.64, 1] } },
}

export default function HeroSection() {
  const [envelopeOpened, setEnvelopeOpened] = useState(false)
  const reduced = useReducedMotion()
  const v = reduced ? { hidden: {}, show: {} } : null
  const { goTo } = useFlipBook()

  return (
    <section id="hero" className={styles.hero} aria-label="Wedding invitation hero">

      {/* Layer 1 — video */}
      <div className={styles.videoBg} aria-hidden="true">
        <video
          className={styles.video}
          src={`${import.meta.env.BASE_URL}assets/hero-bg.mp4`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className={styles.overlay} />
        <div className={styles.vignette} />
        <div className={styles.centerGlow} />
      </div>

      {/* Layer 2 — particles */}
      <GoldParticles />

      {/* Layer 3 — petals */}
      <RosePetals />

      {/* Layer 4 — content */}
      <div className={styles.content}>
        <motion.div
          className={styles.contentInner}
          variants={v ?? stagger}
          initial="hidden"
          animate="show"
        >
          {/* Emblem */}
          <motion.div variants={v ?? scaleIn} className={styles.emblem} aria-hidden="true">
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="56" stroke="url(#gr)" strokeWidth="1.2" />
              <circle cx="60" cy="60" r="46" stroke="url(#gr)" strokeWidth="0.6" strokeDasharray="3 4" />
              {[0,45,90,135].map(d => (
                <line key={d} x1="60" y1="14" x2="60" y2="106" stroke="url(#gr)" strokeWidth="0.7"
                  transform={`rotate(${d} 60 60)`} />
              ))}
              {[0,45,90,135,180,225,270,315].map((d,i) => (
                <ellipse key={i} cx="60" cy="40" rx="5" ry="12"
                  fill="url(#gf)" fillOpacity="0.6"
                  transform={`rotate(${d} 60 60)`} />
              ))}
              <circle cx="60" cy="60" r="10" fill="url(#gf)" fillOpacity="0.85" />
              <circle cx="60" cy="60" r="5"  fill="url(#gf)" />
              <defs>
                <linearGradient id="gr" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#F5E6B8" />
                  <stop offset="50%"  stopColor="#C9A84C" />
                  <stop offset="100%" stopColor="#E8C96B" />
                </linearGradient>
                <linearGradient id="gf" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#F5E6B8" />
                  <stop offset="100%" stopColor="#C9A84C" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Eyebrow */}
          <motion.p variants={v ?? fadeUp} className={styles.eyebrow}>
            Together with our families
          </motion.p>

          {/* Heading */}
          <motion.h1 variants={v ?? fadeUp} className={styles.heading}>
            A Celebration of Love
          </motion.h1>

          {/* Names */}
          <motion.p variants={v ?? fadeUp} className={styles.coupleNames}>
            Pragati <span className={styles.amp}>&amp;</span> Gaurav
          </motion.p>

          {/* Divider */}
          <motion.div variants={v ?? fadeIn} className={styles.rule} aria-hidden="true">
            <span className={styles.ruleOrnament}>✦</span>
          </motion.div>

          {/* Date */}
          <motion.p variants={v ?? fadeUp} className={styles.weddingDate}>
            15 February 2027
          </motion.p>

          {/* Envelope */}
          <motion.div variants={v ?? scaleIn} className={styles.envelopeWrap}>
            <Envelope onOpen={() => setEnvelopeOpened(true)} compact />
          </motion.div>

          {/* CTA — flips to page 1 (Couple) like opening an invitation card */}
          <motion.div variants={v ?? fadeUp}>
            <button
              className={styles.ctaBtn}
              aria-label="Open wedding invitation"
              onClick={() => goTo(1)}
            >
              {envelopeOpened ? 'Explore Celebrations' : 'Open Invitation'}
              <span className={styles.ctaArrow} aria-hidden="true">→</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
