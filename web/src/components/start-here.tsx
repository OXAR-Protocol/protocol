"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { PhotoBg } from "@/components/photo-bg";
import { useT } from "@/lib/i18n";

/**
 * The nudge for an account with nothing at work yet.
 *
 * It used to be the WHOLE page in that state — `totalUsdc === 0` replaced the money
 * section outright. But that figure is what's *deposited*, so someone holding $500 in
 * their wallet and nothing in a source got a screen with no number on it at all: no
 * balance, no "free to use", no way to top up or send, no history. The app knew
 * exactly how much they had and showed them a picture of coins instead.
 *
 * So it is an addition now, not a replacement. The balance stays where it always is,
 * and this sits below it — where a nudge belongs, under the fact it is nudging about.
 */
export function StartHere() {
  const { t } = useT();

  return (
    <div className="relative overflow-hidden rounded-panel border border-ink/10 bg-paper">
      <PhotoBg src="/art/coin-stacking.webp" scrim="left" position="object-right" />
      <div className="relative p-8 md:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-2 py-1 text-[10px] lowercase tracking-widest text-[var(--brand)]">
          <Sparkles size={10} strokeWidth={1.5} />
          {t("home.startHere")}
        </span>
        <h2 className="mt-4 text-2xl leading-tight lowercase text-ink md:text-3xl">
          {t("home.napping1")}
          <br />
          <span className="text-ink/55">{t("home.napping2")}</span>
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/55">{t("home.empty.body")}</p>
        <Link
          href="/market"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[14px] font-medium lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85"
        >
          {t("home.wakeUp")}
          <ArrowUpRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}
