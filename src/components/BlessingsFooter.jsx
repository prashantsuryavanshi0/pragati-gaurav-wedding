import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import styles from './BlessingsFooter.module.css'

export default function BlessingsFooter() {
  const ref     = useRef(null)
  const inView  = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()
  const show    = inView && !reduced

  return (
    <footer className={styles.footer} ref={ref} aria-label="Wedding blessings and closing">
      <div className={styles.inner}>

        <div className={styles.rule}><span>✦</span></div>

        <motion.p
          className={styles.blessText}
          initial={{ opacity: 0, y: 20 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
        >
          May the sacred fire witness their vows and may the blessings of family,
          friends and the divine surround{' '}
          <strong>Pragati &amp; Gaurav</strong> on every step of their
          journey together.
          <br /><br />
          We humbly request the honour of your presence to share in the joy of
          this blessed union and to shower the couple with your love and blessings.
        </motion.p>

        <motion.div
          className={styles.closingLine}
          initial={{ opacity: 0 }}
          animate={show ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.35 }}
        >
          With Love &amp; Blessings
        </motion.div>

        <p className={styles.footerNote}>
          Pragati &amp; Gaurav &nbsp;·&nbsp; 15 February 2027
        </p>

      </div>
    </footer>
  )
}
