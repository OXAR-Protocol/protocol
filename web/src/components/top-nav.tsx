"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

const tabs = [
  { href: "/home", label: "Home" },
  { href: "/yield", label: "Yield" },
  { href: "/pile", label: "Pile" },
  { href: "/you", label: "You" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const { authenticated, ready, login } = usePrivy();

  return (
    <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-[1300px] mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/home" className="shrink-0">
          <img src="/images/white.svg" alt="OXAR" className="h-7 w-auto" />
        </Link>

        {authenticated ? (
          <div className="hidden md:flex items-center gap-10">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`font-mono text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-white/25 hover:text-white/60"
                  }`}
                >
                  [ {tab.label} ]
                </Link>
              );
            })}
          </div>
        ) : (
          <button
            onClick={login}
            disabled={!ready}
            className="font-mono text-[11px] font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-[5px] bg-white text-black hover:bg-white/90 disabled:bg-white/[0.04] disabled:text-white/30 transition-colors"
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
