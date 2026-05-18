"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/button";

const NAV: readonly { href: string; label: string }[] = [
  { href: "/analyze", label: "Analyzer" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
];

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-surface-0/80 backdrop-blur-md" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <RadarMark />
          <span className="font-mono text-sm uppercase tracking-[0.15em] text-white">
            RADAR
            <span className="ml-2 text-white/30">by OXAR</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-sm uppercase tracking-wide text-white/30 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://oxar.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm uppercase tracking-wide text-white/30 transition-colors hover:text-white"
          >
            OXAR ↗
          </a>
          <Button variant="filled" href="/dashboard">
            Dashboard
          </Button>
        </nav>
      </div>
    </header>
  );
}

function RadarMark() {
  return (
    <svg width="24" height="24" viewBox="-12 -12 24 24" className="text-accent" aria-hidden>
      <circle r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <circle r="6" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.55" />
      <g style={{ transformOrigin: "0 0", animation: "radar-spin 4s linear infinite" }}>
        <path d="M 0,0 L 0,-10 A 10 10 0 0 0 -8.66,-5 Z" fill="currentColor" opacity="0.4" />
        <line x1="0" y1="0" x2="0" y2="-10" stroke="currentColor" strokeWidth="1" />
      </g>
      <circle r="1.5" fill="currentColor" />
    </svg>
  );
}
