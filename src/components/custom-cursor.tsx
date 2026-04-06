"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const TRAIL_LENGTH = 12;
const TRAIL_FADE_STEP = 1 / TRAIL_LENGTH;

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pos = useRef({ x: -100, y: -100 });
  const trail = useRef<{ x: number; y: number }[]>(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }))
  );
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    // Each trail point follows the one before it with lerp
    trail.current[0].x += (pos.current.x - trail.current[0].x) * 0.3;
    trail.current[0].y += (pos.current.y - trail.current[0].y) * 0.3;

    for (let i = 1; i < TRAIL_LENGTH; i++) {
      const prev = trail.current[i - 1];
      const curr = trail.current[i];
      const speed = 0.25 - i * 0.012;
      curr.x += (prev.x - curr.x) * Math.max(speed, 0.05);
      curr.y += (prev.y - curr.y) * Math.max(speed, 0.05);
    }

    // Update dot
    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%) scale(${hovering ? 1.8 : 1})`;
    }

    // Update trail elements
    trailRefs.current.forEach((el, i) => {
      if (!el) return;
      const p = trail.current[i];
      const opacity = (1 - i * TRAIL_FADE_STEP) * 0.6;
      const size = Math.max(6 - i * 0.3, 2);
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
      el.style.opacity = String(opacity);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    });

    rafRef.current = requestAnimationFrame(animate);
  }, [hovering]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      if (!visible) setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, select, textarea")) {
        setHovering(true);
      }
    };
    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, select, textarea")) {
        setHovering(false);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate, visible]);

  return (
    <>
      {/* Lead dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "white",
          boxShadow: "0 0 8px rgba(114,162,240,0.6), 0 0 20px rgba(114,162,240,0.3)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s, transform 0.15s ease-out",
        }}
      />
      {/* Trail particles */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el; }}
          className="fixed top-0 left-0 z-[9998] pointer-events-none"
          style={{
            borderRadius: "50%",
            backgroundColor: i < 4 ? "rgba(114,162,240,0.8)" : "rgba(114,162,240,0.5)",
            boxShadow: i < 3 ? "0 0 6px rgba(114,162,240,0.4)" : "none",
            opacity: 0,
            transition: "none",
          }}
        />
      ))}
    </>
  );
}
