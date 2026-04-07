"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function LoginPage() {
  const { login, authenticated } = usePrivy();

  useEffect(() => {
    if (authenticated) {
      window.location.href = "/vaults";
    }
  }, [authenticated]);

  if (authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/40 font-mono text-sm">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-mono font-bold text-white tracking-wider">
          OXAR
        </h1>
        <p className="text-white/40 font-mono text-sm text-center">
          Government bonds, tokenized on Solana.
        </p>
        <button
          onClick={login}
          className="bg-accent text-white px-8 py-3 rounded-xl font-mono text-sm uppercase tracking-wide"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
