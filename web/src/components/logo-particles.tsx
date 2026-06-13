"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/context/theme-context";

// Particles drift in and assemble into the OXAR logo. The pointer repels
// nearby particles, which then ease back into formation. Canvas2D (no WebGL
// fragility); pauses off-screen / hidden / reduced-motion.
const DPR_CAP = 2;
const LOGO_FILL = 0.42; // logo height as a fraction of the canvas height

type P = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; r: number };

export function LogoParticles({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = ctx; // non-null binding for use inside hoisted closures

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    let particles: P[] = [];
    let raf = 0;
    let running = false;
    const mouse = { x: -9999, y: -9999 };
    const dark = theme !== "light";
    const baseColor = dark ? "232,212,180" : "26,23,20"; // warm ivory vs ink
    const accent = "200,132,30"; // amber

    function sampleTargets(w: number, h: number, img: HTMLImageElement) {
      const targetH = h * LOGO_FILL;
      const scale = targetH / img.height;
      const lw = img.width * scale;
      const lh = img.height * scale;
      const ox = (w - lw) / 2;
      const oy = (h - lh) / 2;

      const tmp = document.createElement("canvas");
      const sw = Math.round(lw);
      const sh = Math.round(lh);
      tmp.width = sw;
      tmp.height = sh;
      const tctx = tmp.getContext("2d")!;
      tctx.drawImage(img, 0, 0, sw, sh);
      const data = tctx.getImageData(0, 0, sw, sh).data;

      const pts: { x: number; y: number }[] = [];
      const step = sw > 260 ? 4 : 3;
      for (let y = 0; y < sh; y += step) {
        for (let x = 0; x < sw; x += step) {
          if (data[(y * sw + x) * 4 + 3] > 130) {
            pts.push({ x: ox + x, y: oy + y });
          }
        }
      }
      return pts;
    }

    function build(pts: { x: number; y: number }[], w: number) {
      particles = pts.map((p) => ({
        x: Math.random() * w,
        y: Math.random() * canvas!.clientHeight,
        tx: p.x,
        ty: p.y,
        vx: 0,
        vy: 0,
        r: Math.random() < 0.12 ? 1.8 : 1.1,
      }));
    }

    function frame() {
      const w = canvas!.width / dpr;
      const h = canvas!.height / dpr;
      c.clearRect(0, 0, w, h);
      for (const p of particles) {
        // ease toward formation
        p.vx += (p.tx - p.x) * 0.02;
        p.vy += (p.ty - p.y) * 0.02;
        // pointer repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const f = (14000 - d2) / 14000;
          const d = Math.sqrt(d2) || 1;
          p.vx += (dx / d) * f * 6;
          p.vy += (dy / d) * f * 6;
        }
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;
        const near = d2 < 14000;
        c.fillStyle = `rgba(${near ? accent : baseColor},${dark ? 0.55 : 0.5})`;
        c.fillRect(p.x, p.y, p.r, p.r);
      }
      if (running && !reduced) raf = requestAnimationFrame(frame);
    }

    function resize(img: HTMLImageElement) {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(sampleTargets(w, h, img), w);
      if (reduced) frame();
    }

    const img = new Image();
    img.onload = () => {
      resize(img);
      running = true;
      if (reduced) frame();
      else raf = requestAnimationFrame(frame);
    };
    img.src = "/images/white.svg";

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onResize = () => img.complete && resize(img);
    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running && img.complete) {
        running = true;
        if (!reduced) raf = requestAnimationFrame(frame);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className={className} />;
}
