"use client";

import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { LOGO_VIEWBOX } from "./logo-path-data";
import {
  WARP_DURATION,
  buildWarpPaths,
  drawPhaseDraw,
  drawPhaseFill,
  drawPhaseBreath,
  drawPhaseUnfill,
  drawPhaseUndraw,
  drawRadialGlow,
  drawPhaseFade,
} from "@/lib/warp-canvas";

interface WarpOptions {
  /** Navigate to this URL when the warp completes. Mutually exclusive with onComplete. */
  url?: string;
  /** Run when the warp completes instead of navigating. Use to reveal a sheet/modal after the animation. */
  onComplete?: () => void;
  /** Override the default warp duration in ms. Useful for shorter "intro" warps that don't change pages. */
  duration?: number;
}

type StartWarp = (options?: WarpOptions | string) => void;

const WarpContext = createContext<{ startWarp: StartWarp }>({
  startWarp: () => {},
});

export function useWarp() {
  return useContext(WarpContext);
}

export function WarpProvider({ children }: { children: ReactNode }) {
  const [isWarping, setIsWarping] = useState(false);
  const [activeDuration, setActiveDuration] = useState(WARP_DURATION);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const router = useRouter();

  const targetUrlRef = useRef<string>("/");
  const onCompleteRef = useRef<(() => void) | null>(null);

  const startWarp = useCallback<StartWarp>(
    (options) => {
      // Normalize string-form (legacy: startWarp("/path")) to options object
      const opts: WarpOptions =
        typeof options === "string" ? { url: options } : (options ?? {});

      targetUrlRef.current = opts.url ?? "";
      onCompleteRef.current = opts.onComplete ?? null;
      const duration = opts.duration ?? WARP_DURATION;
      setActiveDuration(duration);
      setIsWarping(true);

      setTimeout(() => {
        // Stamp the last-warp timestamp so a follow-up entry warp (e.g., after
        // landing → app navigation) can decide to skip and avoid back-to-back warps.
        try {
          window.sessionStorage.setItem("oxar_last_warp_at", String(Date.now()));
        } catch {
          // sessionStorage may be unavailable (private mode, SSR) — that's fine.
        }
        if (onCompleteRef.current) {
          onCompleteRef.current();
          onCompleteRef.current = null;
        } else if (targetUrlRef.current) {
          router.push(targetUrlRef.current);
        }
        setIsWarping(false);
      }, duration);
    },
    [router],
  );

  useEffect(() => {
    if (!isWarping || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;

    const logoScale = 180 / LOGO_VIEWBOX.width;
    const logoW = LOGO_VIEWBOX.width * logoScale;
    const logoH = LOGO_VIEWBOX.height * logoScale;
    const logoX = cx - logoW / 2;
    const logoY = cy - logoH / 2;

    const { paths, glass } = buildWarpPaths();

    startTimeRef.current = performance.now();
    const duration = activeDuration;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(logoX, logoY);
      ctx.scale(logoScale, logoScale);

      if (progress < 0.27) drawPhaseDraw(ctx, progress, paths);
      if (progress >= 0.27 && progress < 0.44) drawPhaseFill(ctx, progress, paths, glass);
      if (progress >= 0.44 && progress < 0.71) drawPhaseBreath(ctx, progress, paths, glass);
      if (progress >= 0.71 && progress < 0.85) drawPhaseUnfill(ctx, progress, paths, glass);
      if (progress >= 0.85 && progress < 0.96) drawPhaseUndraw(ctx, progress, paths);

      ctx.restore();

      drawRadialGlow(ctx, progress, cx, cy);
      drawPhaseFade(ctx, progress, w, h);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isWarping, activeDuration]);

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
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: [0, 0, 0, 1, 1, 0],
                y: [10, 10, 10, 0, 0, 0],
              }}
              transition={{
                duration: WARP_DURATION / 1000,
                times: [0, 0.4, 0.48, 0.55, 0.68, 0.75],
                ease: "easeOut",
              }}
            >
              <span
                className="absolute text-sm md:text-base font-medium tracking-[0.3em] uppercase select-none"
                style={{
                  top: "50%",
                  marginTop: "120px",
                  color: "rgba(0, 0, 0, 0.5)",
                }}
              >
                OXAR PROTOCOL
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </WarpContext.Provider>
  );
}
