"use client";

import { useCallback, useState } from "react";

import { useOxarProgram } from "./use-oxar-program";

interface FaucetResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

async function callFaucet(path: string, address: string): Promise<FaucetResponse> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  return res.json();
}

export function useFaucet() {
  const { walletAddress } = useOxarProgram();
  const [solLoading, setSolLoading] = useState(false);
  const [solMsg, setSolMsg] = useState<string | null>(null);
  const [usdcLoading, setUsdcLoading] = useState(false);
  const [usdcMsg, setUsdcMsg] = useState<string | null>(null);

  const airdropSol = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false;
    setSolLoading(true);
    setSolMsg(null);
    try {
      const data = await callFaucet("/api/faucet-sol", walletAddress.toBase58());
      if (data.success) {
        setSolMsg("1 SOL sent!");
        return true;
      }
      setSolMsg(data.error ?? "Failed to get SOL");
      return false;
    } catch (err: unknown) {
      setSolMsg(err instanceof Error ? err.message : "Failed to get SOL");
      return false;
    } finally {
      setSolLoading(false);
    }
  }, [walletAddress]);

  const mintUsdc = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false;
    setUsdcLoading(true);
    setUsdcMsg(null);
    try {
      const data = await callFaucet("/api/faucet", walletAddress.toBase58());
      if (data.success) {
        setUsdcMsg("10,000 test USDC sent!");
        return true;
      }
      setUsdcMsg(data.error ?? "Faucet failed");
      return false;
    } catch (err: unknown) {
      setUsdcMsg(err instanceof Error ? err.message : "Faucet failed");
      return false;
    } finally {
      setUsdcLoading(false);
    }
  }, [walletAddress]);

  return { airdropSol, solLoading, solMsg, mintUsdc, usdcLoading, usdcMsg };
}
