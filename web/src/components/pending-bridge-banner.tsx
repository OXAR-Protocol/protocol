"use client";

import { Loader2, X } from "lucide-react";

import { usePendingBridge } from "@/hooks/use-pending-bridge";

/**
 * Shown when a cross-chain deposit was interrupted (page closed mid-bridge).
 * Resumes polling for the USDC arrival and finishes the deposit automatically.
 */
export function PendingBridgeBanner() {
  const { pending, resuming, dismiss } = usePendingBridge();
  if (!pending) return null;

  return (
    <div className="mt-6 p-4 rounded-[8px] border border-accent/30 bg-accent/[0.05] flex items-start gap-3">
      <Loader2 className="text-accent mt-0.5 animate-spin" size={16} strokeWidth={1.5} />
      <div className="flex-1">
        <p className="font-sans text-sm text-white">
          {resuming ? "Finishing your cross-chain deposit…" : "Cross-chain deposit in transit"}
        </p>
        <p className="mt-1 font-mono text-[11px] text-white/40">
          Your funds are bridging to Solana and will auto-deposit on arrival.
          {pending.bridgeScan && (
            <>
              {" "}
              <a
                href={pending.bridgeScan}
                target="_blank"
                rel="noreferrer"
                className="text-accent/80 hover:text-accent underline"
              >
                Track
              </a>
            </>
          )}
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-white/30 hover:text-white transition"
        title="Stop watching (funds still arrive in your wallet)"
      >
        <X size={15} strokeWidth={1.5} />
      </button>
    </div>
  );
}
