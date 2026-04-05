'use client'

import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DURATION = 3500
const ACCENT = '#c8ff00'
const ACCENT_RGB = '200,255,0'

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

const WarpContext = createContext<{ startWarp: (url?: string) => void }>({
  startWarp: () => {},
})

export function useWarp() {
  return useContext(WarpContext)
}

export function WarpProvider({ children }: { children: ReactNode }) {
  const [isWarping, setIsWarping] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const targetUrlRef = useRef<string>('/')

  const startWarp = useCallback((url?: string) => {
    targetUrlRef.current = url || '/'
    setIsWarping(true)
    setTimeout(() => {
      window.location.href = targetUrlRef.current
    }, DURATION)
  }, [])

  useEffect(() => {
    if (!isWarping || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)

    const cx = w / 2
    const cy = h / 2

    // Star field
    const stars = Array.from({ length: 400 }, () => ({
      x: (Math.random() - 0.5) * w * 2,
      y: (Math.random() - 0.5) * h * 2,
      z: Math.random() * 1000,
      size: Math.random() * 2 + 0.5,
    }))

    startTimeRef.current = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / DURATION, 1)

      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, w, h)

      // Stars warp effect
      const speed = progress < 0.3
        ? easeOutCubic(progress / 0.3) * 15
        : 15 + easeInOutCubic((progress - 0.3) / 0.7) * 85

      for (const star of stars) {
        star.z -= speed
        if (star.z <= 0) star.z = 1000

        const sx = (star.x / star.z) * 300 + cx
        const sy = (star.y / star.z) * 300 + cy

        if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue

        const brightness = Math.min(1, (1000 - star.z) / 600)
        const streak = Math.min(speed * 0.4, 40)
        const px = ((star.x / (star.z + streak)) * 300) + cx
        const py = ((star.y / (star.z + streak)) * 300) + cy

        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${brightness * 0.8})`
        ctx.lineWidth = star.size * (progress > 0.5 ? 1.5 : 1)
        ctx.stroke()

        // Star dot
        ctx.beginPath()
        ctx.arc(sx, sy, star.size * brightness, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
        ctx.fill()
      }

      // OXAR text in center
      if (progress > 0.15 && progress < 0.85) {
        const textAlpha = progress < 0.3
          ? (progress - 0.15) / 0.15
          : progress > 0.75
            ? 1 - (progress - 0.75) / 0.1
            : 1
        const scale = 1 + Math.sin(progress * Math.PI) * 0.05

        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(scale, scale)
        ctx.font = '700 80px "Bebas Neue", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.letterSpacing = '12px'

        // Glow
        ctx.shadowColor = ACCENT
        ctx.shadowBlur = 30 * textAlpha
        ctx.fillStyle = `rgba(${ACCENT_RGB}, ${textAlpha * 0.8})`
        ctx.fillText('OXAR', 0, 0)

        // Main text
        ctx.shadowBlur = 0
        ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`
        ctx.fillText('OXAR', 0, 0)
        ctx.restore()
      }

      // Radial glow
      if (progress > 0.1 && progress < 0.9) {
        const glowAlpha = Math.sin(((progress - 0.1) / 0.8) * Math.PI) * 0.15
        const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250)
        glowGrad.addColorStop(0, `rgba(${ACCENT_RGB}, ${glowAlpha})`)
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(cx, cy, 250, 0, Math.PI * 2)
        ctx.fill()
      }

      // Final fade
      if (progress >= 0.92) {
        const fadeP = (progress - 0.92) / 0.08
        ctx.fillStyle = `rgba(8, 8, 8, ${fadeP})`
        ctx.fillRect(0, 0, w, h)
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [isWarping])

  return (
    <WarpContext.Provider value={{ startWarp }}>
      {children}
      <AnimatePresence>
        {isWarping && (
          <motion.div
            className="fixed inset-0 z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <canvas ref={canvasRef} className="absolute inset-0" />
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0, 1, 1, 0] }}
              transition={{
                duration: DURATION / 1000,
                times: [0, 0.40, 0.48, 0.55, 0.70, 0.80],
                ease: 'easeOut',
              }}
            >
              <span
                className="absolute text-sm font-mono tracking-[0.3em] uppercase select-none"
                style={{ top: '50%', marginTop: '70px', color: 'rgba(255,255,255,0.5)' }}
              >
                OXAR PROTOCOL
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </WarpContext.Provider>
  )
}
