"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VaultDetailRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/vaults"); }, [router]);
  return null;
}
