"use client";

import { useRef, useEffect, useState } from "react";

import { useCanvasPerf } from "@/hooks/use-canvas-perf";
import {
  ISOMETRIC,
  isoToScreen,
  drawCollapsedDots,
  drawCube,
} from "@/lib/isometric-draw";

interface IsometricBoxesProps {
  className?: string;
}

/**
 * Spline-style isometric cubes.
 * IDLE: collapsed to 4 tiny colored dots (diamond corners). No animation.
 * HOVER: cubes rise into big 3D boxes with dark faces, neon gradient edges.
 */
export function IsometricBoxes({ className = "" }: IsometricBoxesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setIsDark] = useState(true);
  const isDarkRef = useRef(true);

  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.getAttribute("data-theme") !== "light";
      setIsDark(dark);
      isDarkRef.current = dark;
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const { dpr, isVisible, observerRef } = useCanvasPerf();
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;

    const mouse = { x: -1000, y: -1000, active: false };
    const autoSpot = { x: -9999, y: -9999 };

    let cubeHeights: Float32Array = new Float32Array(0);
    let cols = 0;
    let rows = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height) {
        mouse.x = mx;
        mouse.y = my;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      if (mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height) {
        mouse.x = mx;
        mouse.y = my;
        mouse.active = true;
      }
    };

    const onTouchEnd = () => {
      mouse.active = false;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / ISOMETRIC.tileW) + 4;
      rows = Math.ceil(h / ISOMETRIC.tileH) + 4;
      cubeHeights = new Float32Array(cols * rows);
    };

    resize();
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    window.addEventListener("resize", resize);

    let drewStaticOnce = false;

    const draw = (time: number) => {
      animId = requestAnimationFrame(draw);

      if (!isVisibleRef.current) {
        if (!drewStaticOnce) {
          ctx.clearRect(0, 0, w, h);
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const [sx, sy] = isoToScreen(col, row);
              drawCollapsedDots(ctx, sx, sy, w, isDarkRef.current);
            }
          }
          drewStaticOnce = true;
        }
        return;
      }
      drewStaticOnce = false;

      ctx.clearRect(0, 0, w, h);

      const t = time * 0.001;

      if (!mouse.active) {
        // Lissajous figure-8 pattern when no cursor is active
        autoSpot.x = w / 2 + Math.sin(t * 0.18) * w * 0.28;
        autoSpot.y = h / 2 + Math.sin(t * 0.24) * h * 0.22;
      }

      const spotX = mouse.active ? mouse.x : autoSpot.x;
      const spotY = mouse.active ? mouse.y : autoSpot.y;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const [sx, sy] = isoToScreen(col, row);
          const dx = sx - spotX;
          const dy = sy - spotY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const proximity = Math.max(0, 1 - dist / ISOMETRIC.influenceRadius);
          const targetLift = proximity * proximity * ISOMETRIC.maxLift;
          const idx = row * cols + col;
          const speed = targetLift > cubeHeights[idx] ? 0.1 : 0.06;
          cubeHeights[idx] += (targetLift - cubeHeights[idx]) * speed;
          if (cubeHeights[idx] < 0.5) cubeHeights[idx] = 0;
        }
      }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const [sx, sy] = isoToScreen(col, row);
          const idx = row * cols + col;
          const lift = cubeHeights[idx];

          if (lift < 1) {
            drawCollapsedDots(ctx, sx, sy, w, isDarkRef.current);
          } else {
            drawCube(ctx, sx, sy, lift, w, isDarkRef.current);
          }
        }
      }
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", resize);
    };
  }, [dpr]);

  return (
    <canvas
      ref={(el) => {
        (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
        (observerRef as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        maskImage: "linear-gradient(to bottom, transparent 3%, black 15%, black 85%, transparent 97%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 3%, black 15%, black 85%, transparent 97%)",
      }}
    />
  );
}
