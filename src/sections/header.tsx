"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { useTheme } from "@/context/theme-context";
import { useWarp } from "@/components/warp-transition";

type NavItem =
  | { label: string; href: string; warp?: false }
  | { label: string; warpTo: string; warp: true };

const NAV_ITEMS: NavItem[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Docs", warpTo: "/docs", warp: true },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { startWarp } = useWarp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen ? "bg-surface-0/80 backdrop-blur-md" : ""
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center">
          <img src="/images/white.svg" alt="ETNY" className="h-8 w-auto" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) =>
            item.warp ? (
              <button
                key={item.label}
                onClick={() => startWarp(item.warpTo)}
                className="font-mono text-sm uppercase tracking-wide text-white/30 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="font-mono text-sm uppercase tracking-wide text-white/30 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            )
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border hover:bg-surface-1 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <Button variant="filled" href="#">
            Launch App
          </Button>
        </nav>

        {/* Hamburger button */}
        <button
          className="md:hidden relative w-6 h-5 flex flex-col justify-between"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <span
            className={`block h-px w-full bg-white transition-all duration-200 origin-center ${
              mobileOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-full bg-white transition-opacity duration-200 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-px w-full bg-white transition-all duration-200 origin-center ${
              mobileOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-white/10 bg-surface-0/95 backdrop-blur-md">
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col gap-4">
            {NAV_ITEMS.map((item) =>
              item.warp ? (
                <button
                  key={item.label}
                  onClick={() => {
                    setMobileOpen(false);
                    startWarp(item.warpTo);
                  }}
                  className="font-mono text-sm uppercase tracking-wide text-white/60 hover:text-white transition-colors py-1 text-left"
                >
                  {item.label}
                </button>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-mono text-sm uppercase tracking-wide text-white/60 hover:text-white transition-colors py-1"
                >
                  {item.label}
                </a>
              )
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border hover:bg-surface-1 transition-colors w-fit"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <Button variant="filled" href="#" onClick={() => setMobileOpen(false)}>
              Launch App
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
