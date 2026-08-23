"use client";

import { ClipboardPaste, Check } from "lucide-react";

import { AssetIcon } from "@/components/asset-icon";
import { isValidAddressForChain } from "@/lib/wallet/transfer";
import type { DestChain } from "@/lib/wallet/outbound-destinations";
import { useT } from "@/lib/i18n";

/**
 * Where it's going. One field, at the top, and nothing else on the screen —
 * an address is pasted, glanced at, and moved past.
 *
 * The tick is the whole validation: an address is either the shape this chain uses
 * or it isn't, and saying so as it's pasted beats saying so after a signature.
 */
export function SendAddress({
  chain,
  value,
  onChange,
  onContinue,
}: {
  chain: DestChain;
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const { t } = useT();
  const trimmed = value.trim();
  const valid = isValidAddressForChain(trimmed, chain.chain);
  const isEvm = chain.chain === "ethereum";

  const paste = async () => {
    try {
      onChange((await navigator.clipboard.readText()).trim());
    } catch {
      // Clipboard read denied — typing still works.
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-2.5">
        <AssetIcon src={`/logos/chains/${chain.key}.png`} label={chain.label} size={28} />
        <p className="text-[13px] text-ink/60">{t("send.address.on", { chain: chain.label })}</p>
      </div>

      <div className="flex items-center gap-2 rounded-card border border-ink/12 px-4 py-3.5 transition-colors focus-within:border-ink/40">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isEvm ? "0x…" : t("send.addressPlaceholder")}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink/25"
        />
        {valid ? (
          <Check size={15} strokeWidth={2} className="shrink-0 text-profit" />
        ) : (
          // Addresses are pasted, never typed — the button saves a fiddly long-press
          // on a phone, which is where this is used.
          <button
            type="button"
            onClick={paste}
            className="inline-flex shrink-0 items-center gap-1 text-[12px] lowercase tracking-wide text-ink/45 transition hover:text-ink"
          >
            <ClipboardPaste size={13} strokeWidth={1.5} />
            {t("send.paste")}
          </button>
        )}
      </div>

      {/* EVM addresses look identical on every chain — say which network the funds
          land on, because nothing on the other side will. */}
      <p className="mt-2 text-[11px] leading-snug text-ink/45">
        {trimmed !== "" && !valid
          ? t("send.errAddress", { chain: isEvm ? "EVM" : "Solana" })
          : isEvm
            ? t("send.evmWarning", { chain: chain.label })
            : t("send.address.hint")}
      </p>

      <button
        type="button"
        onClick={onContinue}
        disabled={!valid}
        className="mt-5 w-full rounded-full bg-ink px-4 py-3.5 text-[14px] lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85 disabled:opacity-25"
      >
        {t("fund.card.continue")}
      </button>
    </>
  );
}
