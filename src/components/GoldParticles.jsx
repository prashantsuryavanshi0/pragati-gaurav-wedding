import { useEffect, useRef } from 'react'

/**
 * Canvas-based floating gold particles.
 * Renders above the video layer, below the content layer.
 */
export default function GoldParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const W = () => canvas.width
    const H = () => canvas.height

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    function mkParticle() {
      return {
        x:       Math.random() * W(),
        y:       Math.random() * H(),
        r:       Math.random() * 2.2 + 0.4,
        vx:      (Math.random() - 0.5) * 0.25,
        vy:      -(Math.random() * 0.55 + 0.15),
        life:    Math.random(),
        maxLife: Math.random() * 0.7 + 0.35,
        gold:    Math.random() > 0.5,
      }
    }

    function init() {
      resize()
      particles = Array.from({ length: 90 }, mkParticle)
    }

    function draw() {
      ctx.clearRect(0, 0, W(), H())
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.life += 0.003

        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.75
        const color = p.gold ? `rgba(201,168,76,${alpha})` : `rgba(240,210,130,${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        if (p.life >= p.maxLife || p.y < -10) {
          Object.assign(p, mkParticle(), { y: H() + 5, life: 0 })
        }
      }
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
        zIndex: 3,
      }}
    />
  )
}
