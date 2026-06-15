"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, Users, User } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/yield", label: "Yield", icon: TrendingUp },
  { href: "/pile", label: "Pile", icon: Users },
  { href: "/you", label: "You", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { authenticated } = usePrivy();

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
                {tab.label.toLowerCase()}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
