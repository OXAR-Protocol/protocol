"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TOP_TABS } from "./nav-data";

function isActiveTab(pathname: string, href: string): boolean {
  if (href === "/docs") {
    return pathname === "/docs" || pathname.startsWith("/docs/authentication")
      || pathname.startsWith("/docs/rate-limits") || pathname.startsWith("/docs/errors");
  }
  if (href === "/docs/examples") return pathname.startsWith("/docs/examples");
  return pathname.startsWith("/docs/protocols") || pathname.startsWith("/docs/analyze-wallet");
}

export function DocsTopTabs() {
  const pathname = usePathname();
  return (
    <div className="border-b border-white/10">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <nav className="flex items-end gap-8">
          {TOP_TABS.map((tab) => {
            const active = isActiveTab(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative -mb-px border-b py-3.5 font-sans text-[14px] transition ${
                  active
                    ? "border-white text-white"
                    : "border-transparent text-white/45 hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
