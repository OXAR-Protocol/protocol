"use client";

import { useState } from "react";
import { formatSerial, type Rank } from "@/hooks/use-waitlist";

function aheadPct(rank: Rank): number {
  if (rank.total <= 1) return 0;
  return Math.round(((rank.total - rank.position) / rank.total) * 100);
}

export function WaitlistSuccess({
  serial,
  shareUrl,
  rank,
  referred,
}: {
  serial: number;
  shareUrl: string | null;
  rank: Rank | null;
  referred: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — link stays visible to copy by hand */
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-[520px] text-center">
      <p className="lowercase text-[14px] text-white/55">
        you&apos;re in{referred ? " — and you started ahead" : ""}.
      </p>

      {/* Position — the number is the rank. A big number implies a crowd. */}
      {rank && (
        <>
          <p className="mt-5 text-[clamp(48px,9vw,88px)] leading-none tracking-[-0.06em]">
            #{rank.position.toLocaleString()}
          </p>
          <p className="mt-3 lowercase text-[15px] text-white/55">
            ahead of {aheadPct(rank)}% of the list · {rank.referrals} invited
          </p>
        </>
      )}

      {/* Share link — each friend who joins moves you up. */}
      {shareUrl && (
        <div className="mx-auto mt-7 flex max-w-[460px] items-center gap-2 rounded-full border border-white/20 py-1.5 pl-5 pr-1.5">
          <span className="flex-1 truncate text-left text-[14px] lowercase text-white/70">
            {shareUrl.replace(/^https?:\/\//, "")}
          </span>
          <button
            onClick={copy}
            className="shrink-0 rounded-full bg-white px-5 py-2 lowercase text-[14px] font-medium text-black transition-colors hover:bg-white/85"
          >
            {copied ? "copied" : "copy link"}
          </button>
        </div>
      )}

      <p className="mt-5 lowercase text-[13px] text-white/40">
        invite friends — each one moves you up 5 spots. no cap.
      </p>
      <p className="mt-2 lowercase text-[13px] text-white/30">
        founding member · {formatSerial(serial)}
      </p>
    </div>
  );
}
