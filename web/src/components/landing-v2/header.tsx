"use client";

import { useEffect, useState } from "react";
import { HELVETICA } from "./fonts";

const ITEMS = [
  { label: "problem", href: "#problem" },
  { label: "how it works", href: "#how-it-works" },
  { label: "speeds", href: "#speeds" },
  { label: "roadmap", href: "#roadmap" },
];

/**
 * Sticky header that stays hidden over the dark hero, then slides in once you
 * scroll into the content. `mix-blend-difference` inverts the white type
 * against whatever section sits underneath — readable on black, white or grey
 * with zero per-section logic. This is also the answer to "you can't reach the
 * site by scrolling": the header is always one flick away once you move.
 */
export function Header() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 mix-blend-difference transition-[transform,opacity] duration-500 ${
        shown ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center justify-between px-[clamp(24px,5.5vw,80px)] py-5 text-white">
        <a
          href="#top"
          className="text-[20px] font-bold leading-none"
          style={{ fontFamily: HELVETICA }}
        >
          OXAR.
        </a>

        <nav className="hidden items-center gap-[clamp(16px,2.4vw,36px)] md:flex">
          {ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="lowercase text-[14px] tracking-[0.01em] text-white/70 transition-opacity hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#waitlist"
          className="lowercase text-[14px] tracking-[0.01em] underline decoration-1 underline-offset-4 hover:no-underline"
        >
          get early access
        </a>
      </div>
    </header>
  );
}
