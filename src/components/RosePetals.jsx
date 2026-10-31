import { useEffect, useRef } from 'react'

const PETALS = ['🌸', '🌺', '🌹', '✿', '❀']

/**
 * Canvas-based slowly falling rose petals.
 * Intentionally sparse — a dozen petals drifting, not a storm.
 */
export default function RosePetals() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let petals = []

    const W = () => canvas.width
    const H = () => canvas.height

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    function mkPetal(randomY = false) {
      return {
        x:     Math.random() * W(),
        y:     randomY ? Math.random() * H() : -24,
        rot:   Math.random() * 360,
        rotV:  (Math.random() - 0.5) * 1.8,
        vy:    Math.random() * 0.9 + 0.4,
        vx:    (Math.random() - 0.5) * 0.5,
        size:  Math.random() * 14 + 12,
        alpha: Math.random() * 0.45 + 0.25,
        emoji: PETALS[Math.floor(Math.random() * PETALS.length)],
      }
    }

    function init() {
      resize()
      petals = Array.from({ length: 16 }, () => mkPetal(true))
    }

    function draw() {
      ctx.clearRect(0, 0, W(), H())
      for (const p of petals) {
        p.x   += p.vx
        p.y   += p.vy
        p.rot += p.rotV

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.font = `${p.size}px serif`
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillText(p.emoji, 0, 0)
        ctx.restore()

        if (p.y > H() + 30) Object.assign(p, mkPetal())
      }

      // Occasionally spawn a new petal up to a cap
      if (Math.random() < 0.015 && petals.length < 22) petals.push(mkPetal())

      animId = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    init()
    draw()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 4,
      }}
    />
  )
}
