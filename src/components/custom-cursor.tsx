"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "@/context/theme-context";

const TRAIL_LENGTH = 12;
const HISTORY_SIZE = 120;
const TRAIL_SPACING = 8; // more frames between particles = more lag

export function CustomCursor() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pos = useRef({ x: -100, y: -100 });
  const history = useRef<{ x: number; y: number }[]>([]);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    // Push current position to history
    history.current.unshift({ x: pos.current.x, y: pos.current.y });
    if (history.current.length > HISTORY_SIZE) {
      history.current.length = HISTORY_SIZE;
    }

    // Update dot
    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%) scale(${hovering ? 1.8 : 1})`;
    }

    // Each trail particle = a past position from history
    trailRefs.current.forEach((el, i) => {
      if (!el) return;
      const histIdx = (i + 1) * TRAIL_SPACING;
      const p = history.current[Math.min(histIdx, history.current.length - 1)];
      if (!p) return;

      const opacity = (1 - (i + 1) / (TRAIL_LENGTH + 1)) * 0.5;
      const size = Math.max(5 - i * 0.3, 1.5);

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
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: isDark ? "white" : "#1a1a1a",
          boxShadow: isDark
            ? "0 0 10px rgba(114,162,240,0.8), 0 0 25px rgba(114,162,240,0.4)"
            : "0 0 10px rgba(60,60,120,0.5), 0 0 25px rgba(60,60,120,0.2)",
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
            backgroundColor: isDark
              ? (i < 4 ? "rgba(114,162,240,0.8)" : "rgba(114,162,240,0.5)")
              : (i < 4 ? "rgba(30,30,80,0.7)" : "rgba(30,30,80,0.4)"),
            boxShadow: i < 3
              ? (isDark ? "0 0 6px rgba(114,162,240,0.4)" : "0 0 6px rgba(60,60,120,0.3)")
              : "none",
            opacity: 0,
          }}
        />
      ))}
    </>
  );
}
