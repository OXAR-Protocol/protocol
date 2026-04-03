"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/vaults", label: "Vaults" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Nav() {
  const pathname = usePathname();
  const { logout, authenticated, user } = usePrivy();
  const { walletAddress } = useOxarProgram();

  // Debug: log Privy user wallets
  if (typeof window !== "undefined" && authenticated && user) {
    console.log("Privy linked accounts:", JSON.stringify(user.linkedAccounts.map((a: any) => ({ type: a.type, address: a.address, chainType: a.chainType, walletClientType: a.walletClientType }))));
    console.log("OXAR walletAddress:", walletAddress?.toBase58());
  }

  const shortAddress = walletAddress
    ? `${walletAddress.toBase58().slice(0, 4)}...${walletAddress.toBase58().slice(-4)}`
    : null;

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href={authenticated ? "/vaults" : "/login"} className="text-xl font-bold text-[#00D4AA]">
            OXAR
          </Link>
          {authenticated && (
            <div className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {authenticated ? (
            <>
              {shortAddress && (
                <span className="hidden sm:inline-block rounded-md bg-gray-800 px-3 py-1.5 text-xs font-mono text-gray-300">
                  {shortAddress}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                className="bg-[#00D4AA] text-gray-950 font-semibold hover:bg-[#00B892]"
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
