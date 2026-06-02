"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "oxar.access.token.v1";

export type GateState =
  | { kind: "loading" }
  | { kind: "locked" }
  | { kind: "unlocked" };

export function useAccessGate() {
  const [state, setState] = useState<GateState>({ kind: "loading" });
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = window.localStorage.getItem(STORAGE_KEY);
      setState({ kind: token ? "unlocked" : "locked" });
    } catch {
      setState({ kind: "locked" });
    }
  }, []);

  const redeem = useCallback(async (key: string): Promise<boolean> => {
    setRedeeming(true);
    setError(null);
    try {
      const res = await fetch("/api/access/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const json = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !json.token) {
        setError(json.error ?? "Unknown error");
        return false;
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, json.token);
      } catch {
        /* ignore quota */
      }
      setState({ kind: "unlocked" });
      return true;
    } catch {
      setError("Network error");
      return false;
    } finally {
      setRedeeming(false);
    }
  }, []);

  return { state, redeeming, error, redeem };
}
