"use client";

import { Copy, Check } from "lucide-react";

import { useT } from "@/lib/i18n";

/** A labelled fact on the settings page — email, and anything like it. */
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-[5px] border border-black/10">
      <p className="text-xs lowercase tracking-wide text-black/40">{label}</p>
      <p className="mt-1 text-sm text-black">{value}</p>
    </div>
  );
}

/** An address with a copy button — the one thing people come to this page for. */
export function WalletCard({
  label,
  hint,
  address,
  name,
  copied,
  onCopy,
  dim,
}: {
  label: string;
  hint: string;
  address: string;
  /** Primary .sol name (SNS), shown above the address when resolved. */
  name?: string | null;
  copied: boolean;
  onCopy: () => void;
  dim?: boolean;
}) {
  const { t } = useT();
  const short = `${address.slice(0, 6)}…${address.slice(-6)}`;
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-[5px] border ${
        dim ? "border-black/[0.06] bg-white/[0.02]" : "border-black/10"
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs lowercase tracking-wide text-black/40">{label}</p>
        <p className={`mt-1 text-sm ${dim ? "text-black/55" : "text-black"}`}>{name ?? short}</p>
        <p className="mt-1 text-[10px] text-black/40">{name ? short : hint}</p>
      </div>
      <button
        onClick={onCopy}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-black/15 hover:border-black/30 text-[11px] lowercase tracking-wide text-black/60 hover:text-black transition"
      >
        {copied ? (
          <>
            <Check size={12} strokeWidth={1.5} />
            {t("common.copied")}
          </>
        ) : (
          <>
            <Copy size={12} strokeWidth={1.5} />
            {t("common.copy")}
          </>
        )}
      </button>
    </div>
  );
}
