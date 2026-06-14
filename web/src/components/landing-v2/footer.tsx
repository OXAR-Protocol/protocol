"use client";

import { DISPLAY } from "./fonts";
import { Reveal } from "./primitives";

type Link = { label: string; href: string; ext?: boolean };

const COLUMNS: Link[][] = [
  [
    { label: "twitter", href: "https://x.com/the_oxar", ext: true },
    { label: "telegram", href: "https://t.me/eternaki", ext: true },
    { label: "email us", href: "mailto:support@oxar.app", ext: true },
  ],
  [
    { label: "how it works", href: "#how-it-works" },
    { label: "speeds", href: "#speeds" },
    { label: "roadmap", href: "#roadmap" },
  ],
  [
    { label: "brand kit", href: "/kit" },
    { label: "investors", href: "/investors" },
    { label: "terms", href: "/terms" },
  ],
];

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative overflow-hidden bg-black px-[clamp(24px,5.5vw,80px)] pt-[clamp(48px,6vw,80px)] text-white"
    >
      <Reveal>
        <p className="lowercase text-[clamp(18px,1.7vw,24px)] leading-snug">
          feel free to{" "}
          <a href="mailto:support@oxar.app" className="underline decoration-1 underline-offset-4 hover:no-underline">
            drop us a message
          </a>
          <br />
          if you have any questions.
        </p>
      </Reveal>

      <div className="mt-[clamp(56px,8vw,120px)] grid grid-cols-2 gap-y-10 gap-x-8 sm:grid-cols-3 lg:grid-cols-4">
        <div className="hidden lg:block" />
        {COLUMNS.map((col, i) => (
          <ul key={i} className="flex flex-col gap-2 lowercase text-[clamp(14px,1.1vw,16px)]">
            {col.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="text-white/80 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <div className="mt-[clamp(48px,7vw,110px)] flex flex-wrap justify-between gap-y-3 lowercase text-[12px] tracking-[0.02em] text-white/55">
        <a href="/terms" className="hover:text-white">terms of service</a>
        <span>built on solana</span>
        <span>project oxar ©2026</span>
      </div>

      <h2
        className="mt-6 select-none font-bold leading-[0.78] tracking-[-0.02em] text-[27vw]"
        style={{ fontFamily: DISPLAY }}
        aria-hidden
      >
        OXAR.
      </h2>
    </footer>
  );
}
