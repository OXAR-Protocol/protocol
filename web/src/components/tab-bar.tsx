"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, Users, User } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

import { useT } from "@/lib/i18n";

const tabs = [
  { href: "/home", key: "nav.home", icon: Home },
  { href: "/yield", key: "nav.yield", icon: TrendingUp },
  { href: "/pile", key: "nav.pile", icon: Users },
  { href: "/you", key: "nav.you", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { authenticated } = usePrivy();
  const { t } = useT();

  if (!authenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white/90 backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-16 max-w-[600px] items-stretch justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-black" : "text-black/35"
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span className="lowercase text-[10px] tracking-[0.04em]">
                {t(tab.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
