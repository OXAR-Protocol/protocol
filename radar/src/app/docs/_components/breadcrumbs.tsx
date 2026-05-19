"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getBreadcrumbs } from "./nav-data";

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumb = getBreadcrumbs(pathname);
  if (!crumb) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-white/10 bg-surface-0/60 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="flex items-center gap-2 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white/35">
          <Link href="/docs" className="transition hover:text-white">
            Docs
          </Link>
          <Separator />
          <span>{crumb.group}</span>
          <Separator />
          <span className="text-white">{crumb.page}</span>
        </div>
      </div>
    </nav>
  );
}

function Separator() {
  return <span className="text-white/20">/</span>;
}
