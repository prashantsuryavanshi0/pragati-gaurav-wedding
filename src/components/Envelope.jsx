import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Envelope.module.css'

const SCRATCH_THRESHOLD = 0.40
const BRUSH_RADIUS      = 22

function getScratchedRatio(canvas) {
  try {
    const ctx  = canvas.getContext('2d')
    if (!ctx) return 0
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let transparent = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) transparent++
    }
    return transparent / (canvas.width * canvas.height)
  } catch { return 0 }
}

function drawScratchSurface(canvas) {
  try {
    const ctx = canvas.getContext('2d')
    const W   = canvas.width
    const H   = canvas.height
    // Guard: nothing to draw if canvas has no size
    if (!ctx || W <= 0 || H <= 0) return

    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0,   '#6B1515')
    grad.addColorStop(0.5, '#4A0C0C')
    grad.addColorStop(1,   '#380808')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Gold shimmer bands
    for (let i = 0; i < 6; i++) {
      const y0 = H * i / 6, y1 = H * (i + 1) / 6
      const shimmer = ctx.createLinearGradient(0, y0, W, y1)
      shimmer.addColorStop(0,   'rgba(201,168,76,0)')
      shimmer.addColorStop(0.5, 'rgba(201,168,76,0.08)')
      shimmer.addColorStop(1,   'rgba(201,168,76,0)')
      ctx.fillStyle = shimmer
      ctx.fillRect(0, y0, W, y1 - y0)
    }

    // Diamond grid texture
    ctx.strokeStyle = 'rgba(201,168,76,0.12)'
    ctx.lineWidth   = 0.5
    for (let x = 0; x < W + H; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - H, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke()
    }

    // Borders
    ctx.strokeStyle = 'rgba(201,168,76,0.55)'; ctx.lineWidth = 1.5
    ctx.strokeRect(8, 8, W - 16, H - 16)
    ctx.strokeStyle = 'rgba(201,168,76,0.28)'; ctx.lineWidth = 0.75
    ctx.strokeRect(14, 14, W - 28, H - 28)

    // Corner bracket ornaments
    const corners = [
      { x: 8,     y: 8,     sx:  1, sy:  1 },
      { x: W - 8, y: 8,     sx: -1, sy:  1 },
      { x: 8,     y: H - 8, sx:  1, sy: -1 },
      { x: W - 8, y: H - 8, sx: -1, sy: -1 },
    ]
    corners.forEach(({ x, y, sx, sy }) => {
      ctx.strokeStyle = 'rgba(201,168,76,0.70)'; ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x + sx * 18, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + sy * 18)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(201,168,76,0.60)'
      ctx.fill()
    })

    // Text labels
    ctx.save()
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor  = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur   = 4

    const fs1 = Math.max(14, Math.round(W * 0.055))
    ctx.font      = `bold ${fs1}px Georgia, serif`
    ctx.fillStyle = 'rgba(232,201,107,0.88)'
    ctx.fillText('SCRATCH IT', W / 2, H / 2 - 14)

    const fs2 = Math.max(10, Math.round(W * 0.030))
    ctx.font      = `${fs2}px Georgia, serif`
    ctx.fillStyle = 'rgba(201,168,76,0.60)'
    ctx.fillText('to reveal your invitation', W / 2, H / 2 + 10)

    ctx.font      = `${fs2}px serif`
    ctx.fillStyle = 'rgba(201,168,76,0.50)'
    ctx.fillText('✦  ✦  ✦', W / 2, H / 2 + 30)

    ctx.restore()
  } catch (err) {
    console.warn('[Envelope] drawScratchSurface error:', err)
  }
}

/* ─────────────────────────────────────────── */

export default function Envelope({ onOpen, compact }) {
  const canvasRef  = useRef(null)
  const drawing    = useRef(false)
  const lastPt     = useRef(null)
  const triggered  = useRef(false)
  const checkCount = useRef(0)

  const [scratched, setScratched] = useState(false)
  const [showCard,  setShowCard]  = useState(false)

  // ── Init + resize canvas ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const initCanvas = () => {
      try {
        const w = canvas.offsetWidth  || 360
        const h = canvas.offsetHeight || 248
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width  = w
          canvas.height = h
        }
        if (!triggered.current) drawScratchSurface(canvas)
      } catch (err) {
        console.warn('[Envelope] canvas init error:', err)
      }
    }

    // Delay slightly so layout is settled
    const raf = requestAnimationFrame(initCanvas)
    const ro  = new ResizeObserver(initCanvas)
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  // ── Reveal trigger ───────────────────────────────────────────────
  const triggerReveal = useCallback(() => {
    if (triggered.current) return
    triggered.current = true
    setScratched(true)
    setTimeout(() => { setShowCard(true); onOpen?.() }, 380)
  }, [onOpen])

  const maybeReveal = useCallback(() => {
    if (triggered.current) return
    checkCount.current++
    if (checkCount.current % 4 !== 0) return
    const canvas = canvasRef.current
    if (canvas && getScratchedRatio(canvas) >= SCRATCH_THRESHOLD) triggerReveal()
  }, [triggerReveal])

  // ── Scratch stroke ────────────────────────────────────────────────
  const scratch = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas || triggered.current) return
    try {
      const rect = canvas.getBoundingClientRect()
      const px   = (clientX - rect.left) * (canvas.width  / rect.width)
      const py   = (clientY - rect.top)  * (canvas.height / rect.height)
      const ctx  = canvas.getContext('2d')
      if (!ctx) return
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = BRUSH_RADIUS * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath()
      if (lastPt.current) {
        ctx.moveTo(lastPt.current.x, lastPt.current.y)
        ctx.lineTo(px, py)
      } else {
        ctx.arc(px, py, BRUSH_RADIUS, 0, Math.PI * 2)
      }
      ctx.stroke()
      lastPt.current = { x: px, y: py }
      maybeReveal()
    } catch (err) {
      console.warn('[Envelope] scratch error:', err)
    }
  }, [maybeReveal])

  // ── Mouse events ─────────────────────────────────────────────────
  const onMouseDown = useCallback(e => {
    drawing.current = true; lastPt.current = null
    scratch(e.clientX, e.clientY)
  }, [scratch])
  const onMouseMove = useCallback(e => {
    if (drawing.current) scratch(e.clientX, e.clientY)
  }, [scratch])
  const onMouseUp = useCallback(() => {
    drawing.current = false; lastPt.current = null
  }, [])

  // ── Touch events (passive:false only on canvas) ───────────────────
  const scratchRef = useRef(scratch)
  scratchRef.current = scratch   // always up-to-date without stale closures

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onTouchStart = e => {
      e.preventDefault()
      drawing.current = true; lastPt.current = null
      if (e.touches[0]) scratchRef.current(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchMove = e => {
      if (!drawing.current) return
      e.preventDefault()
      if (e.touches[0]) scratchRef.current(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchEnd = () => { drawing.current = false; lastPt.current = null }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: true  })
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
    }
  }, [])   // runs once; scratchRef.current stays fresh

  // ── Close card → reset envelope ──────────────────────────────────
  const handleClose = useCallback(() => {
    setShowCard(false)
    setScratched(false)
    triggered.current  = false
    checkCount.current = 0
    drawing.current    = false
    lastPt.current     = null
    // Redraw scratch surface after state reset
    requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (canvas) drawScratchSurface(canvas)
    })
  }, [])

  return (
    <div className={`${styles.wrapper} ${compact ? styles.wrapperCompact : ''}`}>
      <AnimatePresence mode="wait">

        {/* ── Envelope + scratch canvas ── */}
        {!showCard && (
          <motion.div
            key="envelope"
            className={styles.scene}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{   opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.35 }}
          >
            {/* Envelope body — behind canvas */}
            <div className={styles.envBody}>
              <div className={styles.flapTop}  />
              <div className={styles.flapBotL} />
              <div className={styles.flapBotR} />
              <div className={styles.outerBorder} aria-hidden="true" />
              <div className={styles.innerBorder} aria-hidden="true" />
              {['TL','TR','BL','BR'].map(c => (
                <div key={c} className={`${styles.corner} ${styles[`c${c}`]}`} aria-hidden="true" />
              ))}
              <div className={styles.seal} aria-hidden="true">
                <svg viewBox="0 0 72 72" fill="none">
                  <circle cx="36" cy="36" r="33" stroke="#3D0C0C" strokeWidth="1.2" />
                  <circle cx="36" cy="36" r="27" stroke="#3D0C0C" strokeWidth="0.7" />
                  {[0,45,90,135,180,225,270,315].map((d,i) => (
                    <ellipse key={i} cx="36" cy="20" rx="4" ry="10"
                      fill="#3D0C0C" fillOpacity="0.55"
                      transform={`rotate(${d} 36 36)`} />
                  ))}
                  <text x="36" y="42" textAnchor="middle"
                    fontFamily="Georgia,serif" fontSize="14" fontWeight="600"
                    fill="#3D0C0C" letterSpacing="1">P &amp; G</text>
                </svg>
              </div>
            </div>

            {/* Scratch canvas — fades out once threshold hit */}
            <canvas
              ref={canvasRef}
              className={styles.scratchCanvas}
              style={{ opacity: scratched ? 0 : 1, pointerEvents: scratched ? 'none' : 'auto',
                       transition: 'opacity 0.38s ease' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              tabIndex={0}
              aria-label="Scratch to open the invitation"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') triggerReveal() }}
            />

            {/* Hint / fallback button */}
            {!scratched && (
              <p className={styles.hint}>
                scratch to open &nbsp;·&nbsp;
                <button className={styles.revealBtn} onClick={triggerReveal}>
                  Reveal invitation
                </button>
              </p>
            )}
          </motion.div>
        )}

        {/* ── Invitation card — replaces envelope in same container ── */}
        {showCard && (
          <motion.div
            key="card"
            className={styles.invitationCard}
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92,  y: 8  }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            role="article"
            aria-label="Wedding invitation card"
          >
            <div className={styles.cardBorder} aria-hidden="true" />
            {['TL','TR','BL','BR'].map(c => (
              <div key={c} className={`${styles.cardCorner} ${styles[`cc${c}`]}`} aria-hidden="true" />
            ))}

            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close invitation card">
              ✕
            </button>

            <div className={styles.cardFloral} aria-hidden="true">✦  ✿  ✦</div>

            <div className={styles.cardContent}>
              <p className={styles.cEyebrow}>Together with our families</p>
              <div className={styles.cRule}><span>✦</span></div>
              <p className={styles.cLine}>We Cordially Invite You</p>
              <p className={styles.cLine2}>to Celebrate the Wedding of</p>
              <p className={styles.cNames}>Pragati &amp; Gaurav</p>
              <div className={styles.cRule}><span>✦</span></div>
              <p className={styles.cDate}>15 February 2027</p>
              <p className={styles.cVenue}>Utsav Banquet Hall</p>
              <p className={styles.cSentiment}>
                Your presence will make our special day<br />
                more beautiful and memorable.
              </p>
            </div>

            <div className={styles.cardFloral} aria-hidden="true">✦  ✿  ✦</div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
