"use client";

import { Check, Loader2, X } from "lucide-react";

export interface BridgeStep {
  key: string;
  label: string;
}

/**
 * Compact step tracker for the cross-chain (bridge) route, so the several wallet
 * confirmations don't feel random: the user sees the whole sequence up front and
 * which one is active. `status` is the live deposit status ("idle" before signing).
 * The final "buy" step finishes in the background after the funds bridge, so it
 * stays pending here — it completes from the deposit banner.
 *
 * `failedAt` marks the step that died. Without it a failure reset the whole row to
 * "nothing started" (status goes back to "idle"), which read as if the attempt had
 * never happened — the steps already cleared vanished along with the failed one.
 */
export function BridgeSteps({
  steps,
  status,
  failedAt,
}: {
  steps: BridgeStep[];
  status: string;
  failedAt?: string | null;
}) {
  const failedIdx = failedAt ? steps.findIndex((s) => s.key === failedAt) : -1;
  const liveIdx = steps.findIndex((s) => s.key === status);
  // On a failure the row freezes at the step that broke instead of collapsing.
  const activeIdx = failedIdx > -1 ? failedIdx : liveIdx;

  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => {
        const done = activeIdx > -1 && i < activeIdx;
        const failed = i === failedIdx;
        const active = i === activeIdx && !failed;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] lowercase tracking-wide transition ${
                failed
                  ? "bg-[#D4313C]/10 text-[#D4313C]"
                  : active
                    ? "bg-[#3c05c7]/10 text-[#3c05c7]"
                    : done
                      ? "text-black/50"
                      : "text-black/30"
              }`}
            >
              {failed ? (
                <X size={10} strokeWidth={2.5} />
              ) : active ? (
                <Loader2 size={10} strokeWidth={2} className="animate-spin" />
              ) : done ? (
                <Check size={10} strokeWidth={2.5} />
              ) : (
                <span className="text-black/25">{i + 1}</span>
              )}
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-2 bg-black/10" />}
          </div>
        );
      })}
    </div>
  );
}
