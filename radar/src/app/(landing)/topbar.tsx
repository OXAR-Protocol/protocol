import Link from "next/link";

const NAV: readonly { href: string; label: string }[] = [
  { href: "/analyze", label: "Analyzer" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[rgba(5,6,5,0.7)] backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-6 lg:px-12">
        <Link href="/" className="group flex items-center gap-2.5">
          <RadarMark />
          <div className="leading-none">
            <div className="font-display text-base tracking-tight">
              Radar
              <span className="ml-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                by OXAR
              </span>
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-1)] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://oxar.app"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 hidden items-center gap-1.5 rounded-md border border-[var(--color-line)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)] transition hover:border-[var(--color-accent-edge)] hover:text-[var(--color-accent)] sm:inline-flex"
          >
            OXAR Protocol
            <span className="text-[10px]">↗</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

function RadarMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="-12 -12 24 24"
      className="text-[var(--color-accent)]"
      aria-hidden
    >
      <circle r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle r="6" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <g style={{ transformOrigin: "0 0", animation: "radar-spin 4s linear infinite" }}>
        <path d="M 0,0 L 0,-10 A 10 10 0 0 0 -8.66,-5 Z" fill="currentColor" opacity="0.45" />
        <line x1="0" y1="0" x2="0" y2="-10" stroke="currentColor" strokeWidth="1" />
      </g>
      <circle r="1.5" fill="currentColor" />
    </svg>
  );
}
