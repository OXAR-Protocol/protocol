"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getPrevNext } from "./nav-data";

export function PrevNext() {
  const pathname = usePathname();
  const { prev, next } = getPrevNext(pathname);
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Documentation pager"
      className="mt-16 grid grid-cols-1 gap-3 border-t border-white/10 pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group rounded-[5px] border border-white/10 bg-surface-1 px-5 py-4 transition hover:border-white/25"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
            ← Previous
          </div>
          <div className="mt-1 text-[15px] text-white/80 transition group-hover:text-white">
            {prev.label}
          </div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group rounded-[5px] border border-white/10 bg-surface-1 px-5 py-4 text-right transition hover:border-white/25"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
            Next →
          </div>
          <div className="mt-1 text-[15px] text-white/80 transition group-hover:text-white">
            {next.label}
          </div>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
