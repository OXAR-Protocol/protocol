"use client";

import { useCallback, useState } from "react";

export type WaitlistStatus = "idle" | "submitting" | "sealed" | "error";

interface WaitlistResult {
  serial: number;
  existed: boolean;
}

interface UseWaitlistReturn {
  status: WaitlistStatus;
  serial: number | null;
  existed: boolean;
  error: string | null;
  submit: (email: string, amount: number) => Promise<void>;
  reset: () => void;
}

export function useWaitlist(): UseWaitlistReturn {
  const [status, setStatus] = useState<WaitlistStatus>("idle");
  const [serial, setSerial] = useState<number | null>(null);
  const [existed, setExisted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (email: string, amount: number) => {
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount }),
      });
      const json = (await res.json()) as WaitlistResult & { error?: string };
      if (!res.ok || typeof json.serial !== "number") {
        throw new Error(json.error ?? "Request failed");
      }
      setSerial(json.serial);
      setExisted(!!json.existed);
      setStatus("sealed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setSerial(null);
    setError(null);
    setExisted(false);
  }, []);

  return { status, serial, existed, error, submit, reset };
}

export function formatSerial(serial: number): string {
  return `OXAR-${serial.toString().padStart(5, "0")}`;
}
