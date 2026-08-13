"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { useT } from "@/lib/i18n";

/**
 * Where to send dollars so they land in this wallet.
 *
 * The same address serves both ways in — from a wallet you hold, or out of an
 * exchange — but they are different jobs to the person doing them, so each gets
 * its own line of instructions above the same box. The network warning belongs to
 * the exchange case: picking the wrong one there is how money is actually lost.
 */
export function FundAddress({ address, hint }: { address: string; hint: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <p className="text-[12px] leading-snug text-black/60">{hint}</p>
      <button
        type="button"
        onClick={copy}
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-[10px] border border-black/15 px-4 py-3 text-left transition hover:border-black/40"
      >
        <span className="min-w-0">
          <span className="block text-[11px] lowercase tracking-wide text-black/40">
            {t("fund.yourAddress")}
          </span>
          <span className="block truncate text-[13px] text-black/80">{address}</span>
        </span>
        {copied ? (
          <Check size={15} strokeWidth={1.5} className="shrink-0 text-[#3c05c7]" />
        ) : (
          <Copy size={15} strokeWidth={1.5} className="shrink-0 text-black/40" />
        )}
      </button>
    </div>
  );
}
