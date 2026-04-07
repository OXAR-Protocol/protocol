"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, ArrowLeftRight, Wallet, User } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";

const tabs = [
  { href: "/vaults", label: "Explore", icon: Compass },
  { href: "/marketplace", label: "Marketplace", icon: ArrowLeftRight },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { authenticated } = usePrivy();

  if (!authenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/[0.08]">
      <div className="flex items-center justify-around max-w-[600px] mx-auto h-16">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              {isActive ? (
                <motion.div
                  key={pathname}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Icon className="w-5 h-5 text-accent" />
                </motion.div>
              ) : (
                <Icon className="w-5 h-5 text-white/30" />
              )}
              <span
                className={`text-[10px] ${
                  isActive ? "text-accent" : "text-white/30"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
