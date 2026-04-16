"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

const PUBLIC_APP_PATHS = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (authenticated) return;
    if (PUBLIC_APP_PATHS.some((p) => pathname.startsWith(p))) return;
    router.replace("/login");
  }, [ready, authenticated, pathname, router]);

  return <>{children}</>;
}
