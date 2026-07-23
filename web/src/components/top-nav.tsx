"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

import { DISPLAY } from "@/components/landing-v2/fonts";
import { WalletMenu } from "@/components/wallet-menu";

const tabs = [
  { href: "/home", label: "home" },
  { href: "/yield", label: "yield" },
  { href: "/pile", label: "portfolio" },
  { href: "/you", label: "you" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const { authenticated, ready, login } = usePrivy();

  return (
    <nav className="sticky top-0 z-40 bg-[#fbfaf8]/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-5">
        <Link href="/home" className="shrink-0 text-[22px] font-bold leading-none text-black" style={{ fontFamily: DISPLAY }}>
          OXAR.
        </Link>

        <div className="flex items-center gap-[clamp(16px,3vw,40px)]">
          {authenticated && (
            <div className="hidden items-center gap-[clamp(16px,2.4vw,36px)] md:flex">
              {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`lowercase text-[15px] transition-colors ${
                      isActive ? "text-black" : "text-black/40 hover:text-black"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          )}

          {ready &&
            (authenticated ? (
              <WalletMenu />
            ) : (
              <button
                onClick={() => login()}
                className="rounded-full bg-black px-5 py-2 lowercase text-[14px] font-medium text-white transition-colors hover:bg-black/85"
              >
                sign in
              </button>
            ))}
        </div>
      </div>
    </nav>
  );
}
