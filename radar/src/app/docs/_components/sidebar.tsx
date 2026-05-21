"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_GROUPS } from "./nav-data";

export function DocsSidebar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-12 pr-4">
      <div className="space-y-8">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
              {group.title}
            </div>
            <ul className="mt-3 space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group relative -ml-3 block rounded-md px-3 py-1.5 font-sans text-[13px] transition ${
                        active
                          ? "bg-white/5 text-white"
                          : "text-white/45 hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-accent" />
                      )}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
