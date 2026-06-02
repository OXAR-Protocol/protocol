"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GatePage() {
  const router = useRouter();

  // The AccessGate wrapper in (app)/layout handles ?k= auto-redeem and
  // displays the key form when locked. Once unlocked, this page renders
  // and we forward users into the app.
  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return null;
}
