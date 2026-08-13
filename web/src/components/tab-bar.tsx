"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, User } from "lucide-react";

import { useT } from "@/lib/i18n";

const tabs = [
  { href: "/portfolio", key: "nav.portfolio", icon: Wallet },
  { href: "/market", key: "nav.market", icon: TrendingUp },
  { href: "/you", key: "nav.you", icon: User },
] as const;

/**
 * The phone's navigation, as a bar that floats over the page rather than a strip
 * ruled off along the bottom edge.
 *
 * It is there signed out as well: the portfolio and profile exist for a visitor,
 * just empty and offering the way in. A bar that hides itself until you have an
 * account leaves a first-time visitor with no way to move around at all.
 *
 * The dark capsule is one element that slides between tabs (`layoutId`), not three
 * that fade in and out — so the eye follows it across instead of losing it and
 * finding it again somewhere else.
 */
export function TabBar() {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <nav
      data-tour-chrome="tabbar"
      className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden"
    >
      <div className="pointer-events-auto mx-auto mb-3 flex w-fit items-center gap-1 rounded-full border border-black/10 bg-white/85 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 transition-colors ${
                isActive ? "text-white" : "text-black/40 hover:text-black"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-bar-active"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 -z-10 rounded-full bg-black"
                />
              )}
              <Icon size={18} strokeWidth={1.5} />
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden whitespace-nowrap lowercase text-[13px] tracking-[0.02em]"
                >
                  {t(tab.key)}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
