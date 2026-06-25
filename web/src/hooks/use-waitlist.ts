"use client";

import { useCallback, useEffect, useState } from "react";
import type { Rank } from "@/lib/waitlist-referral";

export type { Rank };

export type WaitlistStatus = "idle" | "submitting" | "sealed" | "error";

interface ApiResult extends Partial<Rank> {
  serial: number;
  ref_code?: string;
  existed?: boolean;
  referred?: boolean;
  error?: string;
}

interface Persisted {
  serial: number;
  email: string;
  refCode: string | null;
}

const STORAGE_KEY = "oxar.waitlist.v2";

function loadPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Persisted;
    if (typeof p.serial === "number" && typeof p.email === "string") return p;
  } catch {
    /* ignore */
  }
  return null;
}

function readIncomingRef(): string | null {
  if (typeof window === "undefined") return null;
  const ref = new URLSearchParams(window.location.search).get("ref");
  return ref ? ref.trim().toUpperCase() : null;
}

interface UseWaitlistReturn {
  status: WaitlistStatus;
  serial: number | null;
  refCode: string | null;
  referred: boolean;
  rank: Rank | null;
  incomingRef: string | null;
  shareUrl: string | null;
  error: string | null;
  submit: (email: string, honeypot: string, turnstileToken?: string, ref?: string) => Promise<void>;
  reset: () => void;
}

function buildShareUrl(code: string | null): string | null {
  if (!code || typeof window === "undefined") return null;
  return `${window.location.origin}/?ref=${code}`;
}

export function useWaitlist(): UseWaitlistReturn {
  const [status, setStatus] = useState<WaitlistStatus>("idle");
  const [serial, setSerial] = useState<number | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [referred, setReferred] = useState(false);
  const [rank, setRank] = useState<Rank | null>(null);
  const [incomingRef, setIncomingRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIncomingRef(readIncomingRef());
    const prev = loadPersisted();
    if (!prev) return;
    setSerial(prev.serial);
    setRefCode(prev.refCode);
    setStatus("sealed");
    if (prev.refCode) {
      fetch(`/api/waitlist/position?code=${prev.refCode}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: Rank | null) => d && setRank(d))
        .catch(() => {});
    }
  }, []);

  const submit = useCallback(
    async (email: string, honeypot: string, turnstileToken?: string, ref?: string) => {
      setStatus("submitting");
      setError(null);
      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email, website: honeypot, ref: ref ?? incomingRef, turnstileToken,
          }),
        });
        const json = (await res.json()) as ApiResult;
        if (!res.ok || typeof json.serial !== "number") {
          throw new Error(json.error ?? "Request failed");
        }
        const code = json.ref_code ?? null;
        setSerial(json.serial);
        setRefCode(code);
        setReferred(!!json.referred);
        if (typeof json.position === "number" && typeof json.total === "number") {
          setRank({ position: json.position, total: json.total, referrals: json.referrals ?? 0 });
        }
        setStatus("sealed");
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ serial: json.serial, email, refCode: code } as Persisted),
          );
        } catch {
          /* quota or privacy mode — ignore */
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
        setStatus("error");
      }
    },
    [incomingRef],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setSerial(null);
    setRefCode(null);
    setReferred(false);
    setRank(null);
    setError(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    status, serial, refCode, referred, rank,
    incomingRef, shareUrl: buildShareUrl(refCode), error, submit, reset,
  };
}

export function formatSerial(serial: number): string {
  return `OXAR-${serial.toString().padStart(5, "0")}`;
}
