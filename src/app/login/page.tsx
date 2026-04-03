"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/vaults");
    }
  }, [ready, authenticated, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight text-[#00D4AA]">
            OXAR
          </h1>
          <p className="text-lg text-gray-400">
            Government bonds, tokenized on Solana.
          </p>
          <p className="text-sm text-gray-500">
            Deposit USDC. Earn yield. Trade freely.
          </p>
        </div>

        <Button
          onClick={login}
          size="lg"
          className="w-full bg-[#00D4AA] text-gray-950 font-semibold hover:bg-[#00B892] h-12 text-base"
        >
          Get Started
        </Button>

        <p className="text-xs text-gray-600">
          Powered by Privy &middot; Solana &middot; Anchor
        </p>
      </div>
    </div>
  );
}
