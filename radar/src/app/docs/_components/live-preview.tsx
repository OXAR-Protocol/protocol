"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type Method = "GET" | "POST";

type RunStatus = "idle" | "running" | "done" | "error";

interface LivePreviewProps {
  method: Method;
  path: string;
  /** Display label for the endpoint (optional). */
  title?: string;
  /** Body to send when POST. */
  body?: unknown;
  /** Demo wallets selector — when present, shown as a chooser above Run. */
  walletChoices?: readonly { key: string; label: string }[];
  /** Override the URL Radar hits behind the scenes. Defaults to the path under /api/docs/preview. */
  fetchUrl?: string;
}

export function LivePreview({
  method,
  path,
  title,
  body,
  walletChoices,
  fetchUrl,
}: LivePreviewProps) {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [response, setResponse] = useState<string>("");
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [walletKey, setWalletKey] = useState<string>(walletChoices?.[0]?.key ?? "");

  async function run() {
    setStatus("running");
    setResponse("");
    const url = fetchUrl ?? `/api/docs/preview${path}`;
    const t0 = performance.now();
    try {
      const init: RequestInit = { method };
      if (method === "POST") {
        const payload = walletChoices ? { walletKey } : (body ?? {});
        init.body = JSON.stringify(payload);
        init.headers = { "Content-Type": "application/json" };
      }
      const r = await fetch(url, init);
      const text = await r.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // not JSON; leave raw
      }
      setStatusCode(r.status);
      setElapsedMs(Math.round(performance.now() - t0));
      setResponse(pretty);
      setStatus(r.ok ? "done" : "error");
    } catch (err) {
      setStatusCode(null);
      setElapsedMs(Math.round(performance.now() - t0));
      setResponse(err instanceof Error ? err.message : "Network error");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-[5px] border border-white/10 bg-surface-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-surface-1 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
              method === "POST" ? "bg-accent/20 text-accent" : "bg-white/10 text-white/70"
            }`}
          >
            {method}
          </span>
          <code className="font-mono text-[12px] text-white">{title ?? path}</code>
          <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/40">
            Live preview
          </span>
        </div>
        <StatusPill status={status} statusCode={statusCode} elapsedMs={elapsedMs} />
      </div>

      <div className="space-y-4 p-4">
        {walletChoices && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
              Demo wallet
            </span>
            {walletChoices.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => setWalletKey(w.key)}
                className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition ${
                  walletKey === w.key
                    ? "bg-white text-surface-0"
                    : "border border-white/15 text-white/55 hover:border-white/30 hover:text-white"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={run}
            disabled={status === "running"}
            className="rounded bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-surface-0 transition hover:bg-white/90 disabled:opacity-60"
          >
            {status === "running" ? "Running…" : status === "done" || status === "error" ? "Run again" : "▶ Run live"}
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            radar.oxar.app{path}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {response ? (
            <motion.pre
              key={response.slice(0, 80) + statusCode}
              initial={{ opacity: 0, y: 4, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="max-h-96 overflow-auto rounded border border-white/5 bg-surface-1 p-3 font-mono text-[11px] leading-relaxed text-white"
            >
              {response}
            </motion.pre>
          ) : (
            <p className="font-mono text-[11px] text-white/35">
              {status === "running"
                ? "…awaiting response"
                : "Run the request to see the response from radar.oxar.app."}
            </p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusPill({
  status,
  statusCode,
  elapsedMs,
}: {
  status: RunStatus;
  statusCode: number | null;
  elapsedMs: number | null;
}) {
  if (status === "idle") {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        Ready
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        Connecting…
      </span>
    );
  }
  const ok = status === "done";
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] ${
        ok ? "text-white/80" : "text-yellow-200"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-accent" : "bg-yellow-400"}`} />
      {statusCode ?? "ERR"} · {elapsedMs ?? "?"}ms
    </span>
  );
}
