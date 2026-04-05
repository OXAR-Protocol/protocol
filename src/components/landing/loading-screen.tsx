'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

const ACCENT = '#c8ff00'
const BG = '#080808'

const colorVariants = [
  ACCENT,
  '#ffffff',
  '#a0ff00',
  '#e0ff66',
  '#88cc00',
  '#d4ff33',
]

interface LoadingScreenProps {
  duration?: number
  onComplete?: () => void
}

export function LoadingScreen({
  duration = 2000,
  onComplete,
}: LoadingScreenProps) {
  const [phase, setPhase] = useState<'preloading' | 'cycling' | 'done'>('preloading')
  const [isComplete, setIsComplete] = useState(false)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (phase !== 'preloading') return
    const timeout = setTimeout(() => setPhase('cycling'), 200)
    return () => clearTimeout(timeout)
  }, [phase])

  const finishLoading = useCallback(() => {
    setIsComplete(true)
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    if (phase !== 'cycling') return

    let cancelled = false
    const cycleTime = duration * 0.7
    const startTime = performance.now()
    let index = 0
    let lastSwap = 0

    const tick = (now: number) => {
      if (cancelled) return
      const elapsed = now - startTime
      const progress = elapsed / cycleTime

      if (progress >= 1) {
        setPhase('done')
        return
      }

      const interval = 200 - progress * 120
      if (elapsed - lastSwap >= interval) {
        lastSwap = elapsed
        index = (index + 1) % colorVariants.length
        if (textRef.current) {
          textRef.current.style.color = colorVariants[index]
        }
      }
      requestAnimationFrame(tick)
    }

    if (textRef.current) textRef.current.style.color = colorVariants[0]
    const startTimer = setTimeout(() => requestAnimationFrame(tick), 50)
    return () => { cancelled = true; clearTimeout(startTimer) }
  }, [phase, duration])

  useEffect(() => {
    if (phase !== 'done') return
    const hideTimer = setTimeout(() => finishLoading(), duration * 0.2)
    return () => clearTimeout(hideTimer)
  }, [phase, duration, finishLoading])

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ backgroundColor: BG }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
        >
          {(phase === 'preloading' || phase === 'cycling') && (
            <span
              ref={textRef}
              className="font-display text-[72px] md:text-[100px] tracking-[0.15em] select-none"
              style={{ color: ACCENT }}
            >
              OXAR
            </span>
          )}

          {phase === 'done' && (
            <>
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, scale: 1.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src="/images/white.svg"
                  alt="OXAR"
                  width={120}
                  height={120}
                  className="object-contain"
                  priority
                />
                <motion.div
                  className="absolute inset-0 -z-10"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.3, scale: 2 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    background: `radial-gradient(circle, rgba(200,255,0,0.3), transparent 70%)`,
                  }}
                />
              </motion.div>

              <motion.p
                className="mt-8 text-sm font-medium tracking-[0.3em] uppercase"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                OXAR PROTOCOL
              </motion.p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
