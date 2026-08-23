"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy } from "lucide-react";

import { useT } from "@/lib/i18n";

/**
 * Where to send dollars so they land in this wallet.
 *
 * The QR is the point on a phone: the address is being typed into another app,
 * usually on another device, and a scanned code cannot be mistyped. The line of
 * instructions above it changes with the way in — sending from a wallet you hold
 * and withdrawing from an exchange are the same address but different jobs, and
 * the network warning belongs to the second, where picking wrong loses the money.
 */
export function FundAddress({ address, hint }: { address: string; hint: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div>
      <p className="text-[12px] leading-snug text-ink/60">{hint}</p>

      <div className="mt-4 flex justify-center">
        <div className="rounded-card border border-ink/10 bg-paper p-4">
          <QRCodeSVG value={address} size={168} level="M" />
        </div>
      </div>

      <p className="mt-4 break-all text-center font-mono text-[12px] leading-relaxed text-ink/60">
        {address}
      </p>

      <button
        type="button"
        onClick={copy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-[14px] lowercase tracking-wide text-ink/70 transition hover:border-ink/40 hover:text-ink"
      >
        {copied ? (
          <Check size={14} strokeWidth={2} className="text-[var(--brand)]" />
        ) : (
          <Copy size={14} strokeWidth={1.5} />
        )}
        {copied ? t("common.copied") : t("fund.copyAddress")}
      </button>
    </div>
  );
}
