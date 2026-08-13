"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

import { isPublicAppPath } from "@/lib/access/public-paths";

const ALWAYS_OPEN = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (authenticated) return;
    if (ALWAYS_OPEN.some((p) => pathname.startsWith(p))) return;
    // The catalog is readable signed out; everything that touches a position is not.
    if (isPublicAppPath(pathname)) return;
    // Signed-out visitors land on the catalog rather than a form: it says what this
    // is, and the rails inside it ask them to sign in at the point they act.
    router.replace("/market");
  }, [ready, authenticated, pathname, router]);

  return <>{children}</>;
}
