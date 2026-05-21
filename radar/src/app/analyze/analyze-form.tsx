"use client";

import { useEffect, useState } from "react";

import type { Chain, ExplainOutput, WalletAnalysis } from "@oxar/radar-core";

import { AnalyzeResult } from "./analyze-result";

interface AnalyzeFormProps {
  initialWallet: string;
}

type Status = "idle" | "loading" | "success" | "error";

interface ApiPayload {
  analysis: WalletAnalysis;
  explanation: ExplainOutput;
}

interface ApiError {
  error: string;
  resetAt?: number;
}

export function AnalyzeForm({ initialWallet }: AnalyzeFormProps) {
  const [wallet, setWallet] = useState(initialWallet);
  const [chains, setChains] = useState<Chain[]>(() => detectChains(initialWallet));
  const [status, setStatus] = useState<Status>("idle");
  const [payload, setPayload] = useState<ApiPayload | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (initialWallet) void analyze(initialWallet, detectChains(initialWallet));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze(address: string, requestChains: Chain[]) {
    setStatus("loading");
    setError(undefined);
    setPayload(undefined);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          chains: requestChains,
          language: "en",
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        setError(errorMessageFor(data.error, data.resetAt));
        setStatus("error");
        return;
      }

      const data = (await response.json()) as ApiPayload;
      setPayload(data);
      setStatus("success");

      const url = new URL(window.location.href);
      url.searchParams.set("wallet", address);
      window.history.replaceState({}, "", url.toString());
    } catch {
      setError("Network error. Try again in a moment.");
      setStatus("error");
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = wallet.trim();
    if (!trimmed) return;
    const effectiveChains = chains.length > 0 ? chains : detectChains(trimmed);
    void analyze(trimmed, effectiveChains);
  }

  function onWalletChange(value: string) {
    setWallet(value);
    setChains(detectChains(value));
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x... or Solana base58 address"
          value={wallet}
          onChange={(e) => onWalletChange(e.target.value)}
          className="flex-1 rounded-[5px] border border-white/10 bg-surface-1 px-4 py-3 font-mono text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/40"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-[5px] bg-white px-6 py-3 font-mono text-sm uppercase tracking-wide text-surface-0 transition hover:bg-white/90 disabled:opacity-50"
        >
          {status === "loading" ? "Analyzing…" : "Analyze"}
        </button>
      </form>

      {chains.length > 0 && wallet.trim() && (
        <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          <span>Detected chain:</span>
          {chains.map((c) => (
            <span key={c} className="rounded border border-white/10 px-2 py-0.5 text-white/60">
              {c}
            </span>
          ))}
        </div>
      )}

      {status === "error" && error && (
        <p className="mt-4 rounded-[5px] border border-red-500/30 bg-red-500/5 px-4 py-3 font-mono text-sm text-red-300">
          {error}
        </p>
      )}

      {status === "success" && payload && (
        <AnalyzeResult analysis={payload.analysis} explanation={payload.explanation} />
      )}
    </div>
  );
}

function detectChains(address: string): Chain[] {
  const trimmed = address.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return ["ethereum"];
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return ["solana"];
  return ["ethereum"];
}

function errorMessageFor(code: string | undefined, resetAt?: number): string {
  switch (code) {
    case "invalid_address":
      return "That doesn't look like a valid Ethereum or Solana address.";
    case "rate_limited": {
      const seconds = resetAt ? Math.max(0, Math.ceil((resetAt - Date.now()) / 1000)) : 0;
      return seconds > 0
        ? `Slow down — public demo limit reached. Try again in ${seconds}s.`
        : "Public demo limit reached. Try again shortly.";
    }
    case "analyze_failed":
      return "Something went wrong on our side analyzing this wallet. Try again.";
    default:
      return "Something went wrong. Try again.";
  }
}
