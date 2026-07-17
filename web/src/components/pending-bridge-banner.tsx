"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";

import { usePendingBridge } from "@/hooks/use-pending-bridge";
import { viemChainById } from "@/lib/evm/chains";
import type { PendingBridge } from "@/lib/bridge/pending";

/**
 * A reliable "Track" URL: the origin chain's block explorer for our own bridge tx
 * (always valid). Delora's `bridgeScan` from the quote is unreliable/relative, so we
 * only fall back to it if it's an absolute http(s) link.
 */
function trackUrl(p: PendingBridge): string | null {
  const explorer = viemChainById(p.originChainId)?.blockExplorers?.default?.url;
  if (explorer && p.originTxHash) return `${explorer}/tx/${p.originTxHash}`;
  if (p.bridgeScan && /^https?:\/\//i.test(p.bridgeScan)) return p.bridgeScan;
  return null;
}

/**
 * Cross-chain deposit banner. While bridging: shows progress + a Track link. If the
 * final deposit/swap fails after the funds arrive, shows a "couldn't finish" state
 * with Retry — the funds are safe in the wallet as the bridged token, never lost.
 */
export function PendingBridgeBanner() {
  const { pending, queued, resuming, failed, arrived, dismiss, finish, retry } = usePendingBridge();
  if (!pending) return null;

  const track = trackUrl(pending);
  // >1 bridge in flight (user fired several) — reassure them the rest are queued.
  const more = queued > 1 ? ` (+${queued - 1} more in flight)` : "";

  // External wallet: funds landed, but the buy needs the user's own signature.
  // Offer a one-tap finish (a background sign wouldn't surface the wallet popup).
  if (arrived) {
    return (
      <div className="mb-6 p-4 rounded-[8px] border border-[#3c05c7]/30 bg-[#3c05c7]/[0.05] flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-black">Your funds arrived on Solana</p>
          <p className="mt-1 text-[11px] text-black/45">
            One tap to finish your purchase — your wallet will ask you to sign it.
          </p>
          <button
            onClick={finish}
            disabled={resuming}
            className="mt-2 px-4 py-2 rounded-full bg-black text-white text-[13px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-40 transition inline-flex items-center gap-2"
          >
            {resuming ? (
              <>
                <Loader2 className="animate-spin" size={14} strokeWidth={1.5} /> finishing…
              </>
            ) : (
              "finish your purchase"
            )}
          </button>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-black/40 hover:text-black transition" title="Dismiss">
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="mb-6 p-4 rounded-[8px] border border-[#D4313C]/30 bg-[#D4313C]/[0.05] flex items-start gap-3">
        <AlertTriangle className="text-[#D4313C] mt-0.5" size={16} strokeWidth={1.5} />
        <div className="flex-1">
          <p className="text-sm text-black">Couldn&apos;t finish your deposit</p>
          <p className="mt-1 text-[11px] text-black/45">
            Your funds arrived and are safe in your wallet as digital dollars — the final
            step didn&apos;t complete. Retry, or buy the asset directly.{" "}
            <button onClick={retry} className="text-[#3c05c7]/80 hover:text-[#3c05c7] underline">
              Retry
            </button>
            {track && (
              <>
                {" · "}
                <a href={track} target="_blank" rel="noreferrer" className="text-[#3c05c7]/80 hover:text-[#3c05c7] underline">
                  Track
                </a>
              </>
            )}
          </p>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-black/40 hover:text-black transition" title="Dismiss">
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-[8px] border border-[#3c05c7]/30 bg-[#3c05c7]/[0.05] flex items-start gap-3">
      <Loader2 className="text-[#3c05c7] mt-0.5 animate-spin" size={16} strokeWidth={1.5} />
      <div className="flex-1">
        <p className="text-sm text-black">
          {resuming ? "Finishing your cross-chain deposit…" : `Cross-chain deposit in transit${more}`}
        </p>
        <p className="mt-1 text-[11px] text-black/45">
          Your funds are bridging to Solana and will auto-deposit on arrival.
          {track && (
            <>
              {" "}
              <a href={track} target="_blank" rel="noreferrer" className="text-[#3c05c7]/80 hover:text-[#3c05c7] underline">
                Track
              </a>
            </>
          )}
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-black/40 hover:text-black transition"
        title="Stop watching (funds still arrive in your wallet)"
      >
        <X size={15} strokeWidth={1.5} />
      </button>
    </div>
  );
}
