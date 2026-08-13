"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, TrendingUp, User } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

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
 * The strip took a full band of a small screen and drew a line across everything
 * above it; floating, it costs the width it needs and the page reads on beneath.
 * Only the tab you're on carries its word — three labels at once is what made the
 * strip need that much room in the first place.
 */
export function TabBar() {
  const pathname = usePathname();
  const { authenticated } = usePrivy();
  const { t } = useT();

  if (!authenticated) return null;

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
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 transition-colors ${
                isActive ? "bg-black text-white" : "text-black/40 hover:text-black"
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {isActive && (
                <span className="lowercase text-[13px] tracking-[0.02em]">{t(tab.key)}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
