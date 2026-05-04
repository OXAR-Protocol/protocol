"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, ArrowLeftRight, Wallet, User } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

const tabs = [
  { href: "/vaults", label: "Explore", icon: Compass },
  { href: "/marketplace", label: "Market", icon: ArrowLeftRight },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { authenticated } = usePrivy();

  if (!authenticated) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-white/[0.08]">
      <div className="flex items-stretch justify-around max-w-[600px] mx-auto h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
                isActive ? "text-white" : "text-white/30"
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
