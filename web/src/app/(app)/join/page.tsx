"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Landing spot for the invite link (app.oxar.app/join?code=…). The AccessWall in the
 * layout reads the `?code` and clears the wall for this browser; this page just lands
 * the person in the app. (The code stays out of the app's own URLs after the bounce.)
 */
export default function JoinPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home");
  }, [router]);
  return <div className="fixed inset-0 bg-white" />;
}
