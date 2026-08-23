"use client";

import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { EASE_OUT } from "@/lib/motion";
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
  // The overlay covers the whole screen at z-9999. Until the mark starts fading it
  // has to keep swallowing taps — otherwise a tap meant for the animation lands on
  // whatever is underneath. Once the fade begins there is nothing left to hit, so it
  // gets out of the way rather than holding the app hostage for the last half second.
  const [passthrough, setPassthrough] = useState(false);
  const passthroughRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** A warp is in flight. Not state: the skip handlers read it from a closure. */
  const activeRef = useRef(false);
  const router = useRouter();

  const targetUrlRef = useRef<string>("/");
  const onCompleteRef = useRef<(() => void) | null>(null);

  /** The single exit from a warp — reached by the timer, or early by a skip.
   *
   *  Guarded, because there are now three ways in and they can arrive together: a tap
   *  on a touch device fires `pointerdown` while the timer may already have run, and
   *  a keyboard skip fires alongside neither. Without this, two of them landing in the
   *  same tick would push the destination route twice. */
  const endWarp = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
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
  }, [router]);

  const startWarp = useCallback<StartWarp>(
    (options) => {
      // Normalize string-form (legacy: startWarp("/path")) to options object
      const opts: WarpOptions =
        typeof options === "string" ? { url: options } : (options ?? {});

      targetUrlRef.current = opts.url ?? "";
      onCompleteRef.current = opts.onComplete ?? null;
      const duration = opts.duration ?? WARP_DURATION;
      setActiveDuration(duration);
      passthroughRef.current = false;
      setPassthrough(false);
      activeRef.current = true;
      setIsWarping(true);

      timeoutRef.current = setTimeout(endWarp, duration);
    },
    [endWarp],
  );

  // Anywhere the animation is playing, any tap or any key ends it and goes straight
  // to wherever it was taking you. A three-second splash you cannot dismiss is a toll,
  // and it is charged on every single cold open of the app.
  useEffect(() => {
    if (!isWarping) return;
    const skip = () => endWarp();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [isWarping, endWarp]);

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

      // The canvas covers the whole screen, so painting it white on a dark theme is
      // a flash of the other design mid-navigation. Read the live page colour.
      ctx.fillStyle =
        getComputedStyle(document.documentElement).getPropertyValue("--page").trim() || "#ffffff";
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

      // Same threshold the undraw phase ends on: past here the canvas is only fading
      // out, so it stops intercepting input. Guarded by a ref so this is one state
      // update at the crossing rather than one per frame.
      if (progress >= 0.96 && !passthroughRef.current) {
        passthroughRef.current = true;
        setPassthrough(true);
      }

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
            className={`fixed inset-0 z-[9999] ${passthrough ? "pointer-events-none" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
          >
            {/* Just the mark. The canvas already draws the logo; spelling out
                "OXAR PROTOCOL" underneath it said the same thing twice, in the
                voice of a whitepaper rather than a product. */}
            <canvas ref={canvasRef} className="absolute inset-0" />
          </motion.div>
        )}
      </AnimatePresence>
    </WarpContext.Provider>
  );
}
