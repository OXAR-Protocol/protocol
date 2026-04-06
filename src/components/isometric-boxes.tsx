'use client'

import { useRef, useEffect, useState } from 'react'
import { useCanvasPerf } from '@/hooks/use-canvas-perf'

interface IsometricBoxesProps {
  className?: string
}

/**
 * Spline-style isometric cubes.
 * IDLE: collapsed to 4 tiny colored dots (diamond corners). No animation.
 * HOVER: cubes rise into big 3D boxes with dark faces, neon gradient edges,
 * and colored floor glow. Purple -> blue -> cyan gradient by x-position.
 */
export function IsometricBoxes({ className = '' }: IsometricBoxesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDark, setIsDark] = useState(true)
  const isDarkRef = useRef(true)

  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.getAttribute('data-theme') !== 'light'
      setIsDark(dark)
      isDarkRef.current = dark
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const { dpr, isVisible, observerRef } = useCanvasPerf()
  const isVisibleRef = useRef(isVisible)
  isVisibleRef.current = isVisible

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const maybeCtx = canvas.getContext('2d')
    if (!maybeCtx) return
    const ctx = maybeCtx

    let animId: number
    let w = 0
    let h = 0

    const tileW = 100
    const tileH = 58
    const cubeHW = 44
    const cubeHH = 25
    const maxLift = 56
    const influenceRadius = 280

    const mouse = { x: -1000, y: -1000, active: false }
    const autoSpot = { x: -9999, y: -9999 }

    let cubeHeights: Float32Array = new Float32Array(0)
    let cols = 0
    let rows = 0

    function edgeColor(sx: number, alpha: number): string {
      const t = Math.max(0, Math.min(1, sx / w))
      let r: number, g: number, b: number
      if (isDarkRef.current) {
        if (t < 0.5) {
          const p = t * 2
          r = Math.round(180 * (1 - p) + 80 * p)
          g = Math.round(0 * (1 - p) + 120 * p)
          b = 255
        } else {
          const p = (t - 0.5) * 2
          r = Math.round(80 * (1 - p) + 0 * p)
          g = Math.round(120 * (1 - p) + 220 * p)
          b = 255
        }
      } else {
        if (t < 0.5) {
          const p = t * 2
          r = Math.round(120 * (1 - p) + 60 * p)
          g = Math.round(0 * (1 - p) + 80 * p)
          b = Math.round(200 * (1 - p) + 180 * p)
        } else {
          const p = (t - 0.5) * 2
          r = Math.round(60 * (1 - p) + 0 * p)
          g = Math.round(80 * (1 - p) + 160 * p)
          b = Math.round(180 * (1 - p) + 200 * p)
        }
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      if (mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height) {
        mouse.x = mx
        mouse.y = my
        mouse.active = true
      } else {
        mouse.active = false
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      const mx = touch.clientX - rect.left
      const my = touch.clientY - rect.top
      if (mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height) {
        mouse.x = mx
        mouse.y = my
        mouse.active = true
      }
    }

    const onTouchEnd = () => {
      mouse.active = false
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.ceil(w / tileW) + 4
      rows = Math.ceil(h / tileH) + 4
      cubeHeights = new Float32Array(cols * rows)
    }

    resize()
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)
    window.addEventListener('resize', resize)

    function isoToScreen(col: number, row: number): [number, number] {
      const sx = col * tileW + (row % 2 === 1 ? tileW / 2 : 0)
      const sy = row * tileH
      return [sx, sy]
    }

    function drawCollapsedDots(sx: number, sy: number) {
      const dotR = 1.3
      const hw = cubeHW * 0.35
      const hh = cubeHH * 0.35
      const color = edgeColor(sx, 0.35)

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(sx, sy - hh, dotR, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(sx + hw, sy, dotR, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(sx, sy + hh, dotR, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(sx - hw, sy, dotR, 0, Math.PI * 2)
      ctx.fill()
    }

    function drawCube(sx: number, sy: number, lift: number) {
      const ch = lift
      const hw = cubeHW
      const hh = cubeHH
      const liftFraction = Math.min(lift / maxLift, 1)

      const topFill = isDarkRef.current ? 'rgba(14, 14, 22, 0.95)' : 'rgba(220, 220, 215, 0.95)'
      const leftFill = isDarkRef.current ? 'rgba(8, 8, 14, 0.95)' : 'rgba(200, 200, 195, 0.95)'
      const rightFill = isDarkRef.current ? 'rgba(11, 11, 18, 0.95)' : 'rgba(210, 210, 205, 0.95)'

      const edgeAlpha = 0.3 + liftFraction * 0.5
      const ec = edgeColor(sx, edgeAlpha)

      {
        const glowAlpha = liftFraction * 0.35
        const glowW = hw * 2.5
        const glowH = hh * 1.6
        const grad = ctx.createRadialGradient(sx, sy + hh + 3, 0, sx, sy + hh + 3, glowW)
        grad.addColorStop(0, edgeColor(sx, glowAlpha))
        grad.addColorStop(0.5, edgeColor(sx, glowAlpha * 0.25))
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(sx, sy + hh + 3, glowW, glowH, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.beginPath()
      ctx.moveTo(sx, sy - ch - hh)
      ctx.lineTo(sx + hw, sy - ch)
      ctx.lineTo(sx, sy - ch + hh)
      ctx.lineTo(sx - hw, sy - ch)
      ctx.closePath()
      ctx.fillStyle = topFill
      ctx.fill()
      ctx.strokeStyle = ec
      ctx.lineWidth = 1.3
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(sx - hw, sy - ch)
      ctx.lineTo(sx, sy - ch + hh)
      ctx.lineTo(sx, sy + hh)
      ctx.lineTo(sx - hw, sy)
      ctx.closePath()
      ctx.fillStyle = leftFill
      ctx.fill()
      ctx.strokeStyle = ec
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(sx + hw, sy - ch)
      ctx.lineTo(sx, sy - ch + hh)
      ctx.lineTo(sx, sy + hh)
      ctx.lineTo(sx + hw, sy)
      ctx.closePath()
      ctx.fillStyle = rightFill
      ctx.fill()
      ctx.strokeStyle = ec
      ctx.lineWidth = 1
      ctx.stroke()

      if (liftFraction > 0.2) {
        ctx.strokeStyle = edgeColor(sx, liftFraction * 0.8)
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(sx, sy - ch - hh)
        ctx.lineTo(sx + hw, sy - ch)
        ctx.lineTo(sx, sy - ch + hh)
        ctx.lineTo(sx - hw, sy - ch)
        ctx.closePath()
        ctx.stroke()
      }
    }

    let drewStaticOnce = false

    const draw = (time: number) => {
      animId = requestAnimationFrame(draw)

      if (!isVisibleRef.current) {
        if (!drewStaticOnce) {
          ctx.clearRect(0, 0, w, h)
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const [sx, sy] = isoToScreen(col, row)
              drawCollapsedDots(sx, sy)
            }
          }
          drewStaticOnce = true
        }
        return
      }
      drewStaticOnce = false

      ctx.clearRect(0, 0, w, h)

      const t = time * 0.001

      if (!mouse.active) {
        // Lissajous figure-8 pattern — always visible when no cursor
        autoSpot.x = w / 2 + Math.sin(t * 0.18) * w * 0.28
        autoSpot.y = h / 2 + Math.sin(t * 0.24) * h * 0.22
      }

      const spotX = mouse.active ? mouse.x : autoSpot.x
      const spotY = mouse.active ? mouse.y : autoSpot.y

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const [sx, sy] = isoToScreen(col, row)
          const dx = sx - spotX
          const dy = sy - spotY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const proximity = Math.max(0, 1 - dist / influenceRadius)
          const targetLift = proximity * proximity * maxLift
          const idx = row * cols + col
          const speed = targetLift > cubeHeights[idx] ? 0.1 : 0.06
          cubeHeights[idx] += (targetLift - cubeHeights[idx]) * speed
          if (cubeHeights[idx] < 0.5) cubeHeights[idx] = 0
        }
      }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const [sx, sy] = isoToScreen(col, row)
          const idx = row * cols + col
          const lift = cubeHeights[idx]

          if (lift < 1) {
            drawCollapsedDots(sx, sy)
          } else {
            drawCube(sx, sy, lift)
          }
        }
      }
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', resize)
    }
  }, [dpr])

  return (
    <canvas
      ref={(el) => {
        (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
        ;(observerRef as React.MutableRefObject<HTMLElement | null>).current = el
      }}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 3%, black 15%, black 85%, transparent 97%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 3%, black 15%, black 85%, transparent 97%)',
      }}
    />
  )
}
