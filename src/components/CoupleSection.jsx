import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionVideoBg from './SectionVideoBg'
import styles from './CoupleSection.module.css'

const PHOTOS = {
  Pragati: { src: '/assets/bride-portrait.webp', alt: 'Pragati – The Bride' },
  Gaurav:  { src: '/assets/groom-portrait.webp', alt: 'Gaurav – The Groom' },
}

function Portrait({ name, role, delay }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const photo = PHOTOS[name]

  return (
    <motion.div
      ref={ref}
      className={styles.portrait}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22,1,0.36,1] }}
    >
      <div className={styles.frameOuter}>
        <div className={styles.frameInner}>
          <img
            src={photo.src}
            alt={photo.alt}
            className={styles.photo}
            loading="lazy"
            decoding="async"
            width="600"
            height="800"
          />
          {/* Gold inner glow overlay */}
          <div className={styles.photoGlow} aria-hidden="true" />
          {/* Floral corners */}
          <span className={`${styles.fc} ${styles.fcTL}`}>✿</span>
          <span className={`${styles.fc} ${styles.fcTR}`}>✿</span>
          <span className={`${styles.fc} ${styles.fcBL}`}>✿</span>
          <span className={`${styles.fc} ${styles.fcBR}`}>✿</span>
        </div>
      </div>
      <p className={styles.personName}>{name}</p>
      <p className={styles.personRole}>{role}</p>
    </motion.div>
  )
}

export default function CoupleSection() {
  const headRef = useRef(null)
  const headInView = useInView(headRef, { once: true, margin: '-60px' })
  const verseRef = useRef(null)
  const verseInView = useInView(verseRef, { once: true, margin: '-60px' })

  return (
    <section id="couple" className={styles.section}>
      <SectionVideoBg src="/assets/couple-wedding-landscape.mp4" overlayOpacity={0.48} />
      <div className={styles.bg} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Header */}
        <motion.div
          ref={headRef}
          className={styles.header}
          initial={{ opacity: 0, y: 32 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85 }}
        >
          <p className={styles.eyebrow}>A Match Made in Heaven</p>
          <h2 className={styles.title}>Two Souls, <em>One Journey</em></h2>
          <div className={styles.rule}><span>✦</span></div>
        </motion.div>

        {/* Portraits row */}
        <div className={styles.row}>
          <Portrait name="Pragati" role="The Bride" delay={0.05} />

          {/* Centre amp */}
          <motion.div
            className={styles.ampBlock}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.85, delay: 0.2 }}
          >
            <div className={styles.vertLine} />
            <span className={styles.amp}>&amp;</span>
            <div className={styles.vertLine} />
          </motion.div>

          <Portrait name="Gaurav" role="The Groom" delay={0.12} />
        </div>

        {/* Verse */}
        <motion.div
          ref={verseRef}
          className={styles.verse}
          initial={{ opacity: 0, y: 28 }}
          animate={verseInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.25 }}
        >
          <p className={styles.verseText}>
            "Two lives, two hearts joined together in friendship,<br />
            hope and joy — may this sacred union be blessed for eternity."
          </p>
          <cite className={styles.verseCite}>— A Wedding Blessing</cite>
        </motion.div>
      </div>
    </section>
  )
}
