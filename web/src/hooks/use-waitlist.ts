"use client";

import { useCallback, useEffect, useState } from "react";

export type WaitlistStatus = "idle" | "submitting" | "sealed" | "error";

interface WaitlistResult {
  serial: number;
  existed: boolean;
}

interface Persisted {
  serial: number;
  email: string;
}

const STORAGE_KEY = "oxar.waitlist.v1";

function loadPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (typeof parsed.serial === "number" && typeof parsed.email === "string") {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

interface UseWaitlistReturn {
  status: WaitlistStatus;
  serial: number | null;
  savedEmail: string | null;
  existed: boolean;
  error: string | null;
  submit: (email: string, honeypot: string) => Promise<void>;
  reset: () => void;
}

export function useWaitlist(): UseWaitlistReturn {
  const [status, setStatus] = useState<WaitlistStatus>("idle");
  const [serial, setSerial] = useState<number | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [existed, setExisted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = loadPersisted();
    if (prev) {
      setSerial(prev.serial);
      setSavedEmail(prev.email);
      setExisted(true);
      setStatus("sealed");
    }
  }, []);

  const submit = useCallback(async (email: string, honeypot: string) => {
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: honeypot }),
      });
      const json = (await res.json()) as WaitlistResult & { error?: string };
      if (!res.ok || typeof json.serial !== "number") {
        throw new Error(json.error ?? "Request failed");
      }
      setSerial(json.serial);
      setSavedEmail(email);
      setExisted(!!json.existed);
      setStatus("sealed");
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ serial: json.serial, email } as Persisted),
        );
      } catch {
        /* quota or privacy mode — ignore */
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setSerial(null);
    setSavedEmail(null);
    setError(null);
    setExisted(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { status, serial, savedEmail, existed, error, submit, reset };
}

export function formatSerial(serial: number): string {
  return `OXAR-${serial.toString().padStart(5, "0")}`;
}
