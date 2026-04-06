'use client'

import { useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function GoldIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
      <path d="M6 16L4 22H20L18 16" />
      <rect x="5" y="10" width="14" height="6" rx="1" />
      <rect x="7" y="5" width="10" height="5" rx="1" />
    </svg>
  )
}

function SilverIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 9V15M9.5 10.5L14.5 13.5" />
    </svg>
  )
}

function PlatinumIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
      <path d="M12 3L20 9L16 21H8L4 9L12 3Z" strokeLinejoin="round" />
      <path d="M4 9H20" opacity="0.6" />
      <path d="M8 6L10 12L12 20L14 12L16 6" opacity="0.5" />
    </svg>
  )
}

function StocksIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
      <path d="M3 20L8 14L12 17L21 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 6H21V10" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="20" x2="3" y2="6" opacity="0.4" />
      <line x1="3" y1="20" x2="21" y2="20" opacity="0.4" />
    </svg>
  )
}

function RealEstateIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
      <path d="M3 21V10L12 4L21 10V21" strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="7" />
      <rect x="7" y="10" width="4" height="3" rx="0.5" opacity="0.6" />
      <rect x="13" y="10" width="4" height="3" rx="0.5" opacity="0.6" />
    </svg>
  )
}

function CommoditiesIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
      <path d="M12 3V8M12 8C8 8 5 10 5 13C5 16 8 18 12 18C16 18 19 16 19 13C19 10 16 8 12 8Z" strokeLinecap="round" />
      <path d="M8 18V21M16 18V21" strokeLinecap="round" />
      <path d="M9 4L12 3L15 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EnergyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
      <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" strokeLinejoin="round" />
    </svg>
  )
}

function MineralsIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
      <path d="M5 12L8 6H16L19 12L12 20L5 12Z" strokeLinejoin="round" />
      <path d="M5 12H19" opacity="0.6" />
      <path d="M8 6L10 12L12 20L14 12L16 6" opacity="0.5" />
    </svg>
  )
}

const ASSETS: { icon: ReactNode; label: string }[] = [
  { icon: <GoldIcon />, label: 'Gold' },
  { icon: <SilverIcon />, label: 'Silver' },
  { icon: <PlatinumIcon />, label: 'Platinum' },
  { icon: <StocksIcon />, label: 'Stocks' },
  { icon: <RealEstateIcon />, label: 'Real Estate' },
  { icon: <CommoditiesIcon />, label: 'Commodities' },
  { icon: <EnergyIcon />, label: 'Energy' },
  { icon: <MineralsIcon />, label: 'Minerals' },
]

export function AssetOrbits() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ASSETS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Circle positions relative to center, spreading outward
  // Left: positions -4, -3, -2, -1  |  Center: 0  |  Right: 1, 2, 3, 4
  const circleSize = 160
  const centerSize = 200
  const gap = -16 // slight overlap

  const leftCircles = [3, 2, 1, 0].map((distFromCenter) => ({
    assetIdx: (activeIndex + 4 + distFromCenter) % ASSETS.length,
    opacity: 0.08 + (3 - distFromCenter) * 0.06,
    delay: (distFromCenter + 1) * 0.12,
    iconOpacity: 0.2 + (3 - distFromCenter) * 0.12,
  }))

  const rightCircles = [0, 1, 2, 3].map((distFromCenter) => ({
    assetIdx: (activeIndex + 1 + distFromCenter) % ASSETS.length,
    opacity: 0.25 - distFromCenter * 0.05,
    delay: (distFromCenter + 1) * 0.12,
    iconOpacity: 0.55 - distFromCenter * 0.12,
  }))

  return (
    <section className="relative py-8 overflow-hidden">
      <div className="flex items-center justify-center">
        {/* Left circles — dashed outlines */}
        {leftCircles.map((circle, i) => (
          <div
            key={`left-${i}`}
            className="flex-shrink-0 rounded-full flex items-center justify-center"
            style={{
              width: circleSize,
              height: circleSize,
              marginRight: gap,
              border: `1px dashed rgba(255,255,255,${circle.opacity})`,
              zIndex: i + 1,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeIndex}-l${i}`}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: circle.iconOpacity, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.6, delay: circle.delay }}
              >
                {ASSETS[circle.assetIdx].icon}
              </motion.div>
            </AnimatePresence>
          </div>
        ))}

        {/* Center — ETNY logo */}
        <div
          className="relative flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: centerSize,
            height: centerSize,
            marginLeft: gap,
            marginRight: gap,
            background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.07) 0%, rgba(15,15,15,1) 50%, rgba(10,10,10,1) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 0 100px 20px rgba(0,0,0,0.8)',
            zIndex: 10,
          }}
        >
          <img src="/images/white.svg" alt="ETNY" className="w-16 h-16" />
          <div
            className="absolute inset-0 rounded-full animate-breathing pointer-events-none"
            style={{
              border: '1px dashed rgba(255,255,255,0.06)',
              transform: 'scale(1.18)',
            }}
          />
        </div>

        {/* Right circles — solid dark fills */}
        {rightCircles.map((circle, i) => (
          <div
            key={`right-${i}`}
            className="flex-shrink-0 rounded-full flex items-center justify-center"
            style={{
              width: circleSize,
              height: circleSize,
              marginLeft: gap,
              background: `rgba(20,20,25,${0.7 - i * 0.1})`,
              border: `1px solid rgba(255,255,255,${circle.opacity * 0.35})`,
              zIndex: 4 - i,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeIndex}-r${i}`}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: circle.iconOpacity, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.6, delay: circle.delay }}
              >
                {ASSETS[circle.assetIdx].icon}
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Asset label */}
      <div className="flex justify-center mt-6">
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.35, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="font-mono text-xs uppercase tracking-widest text-white/35"
          >
            {ASSETS[activeIndex].label}
          </motion.span>
        </AnimatePresence>
      </div>
    </section>
  )
}
