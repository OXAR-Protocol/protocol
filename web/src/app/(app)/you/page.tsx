"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { ProfileMoney } from "@/components/profile-money";
import { MoneyPanel } from "@/components/money-panel";
import { PhotoBg } from "@/components/photo-bg";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useSignIn } from "@/hooks/use-sign-in";
import { useRise } from "@/lib/motion";
import { useT } from "@/lib/i18n";

/**
 * You, and your money — one page.
 *
 * There were two: a portfolio and a profile, both leading with a total, both
 * listing the positions, both ending in the history. Two screens for one object
 * meant every change had to be made twice, and they drifted anyway. This is the
 * portfolio; it happens to know your name.
 *
 * Order follows the questions: who am I here, what can I spend, what is it all
 * worth, what is it made of, what did I do. Settings sit behind the gear up top,
 * because a page you open to see what you're worth shouldn't end in configuration.
 */
export default function YouPage() {
  const { ready, authenticated } = usePrivy();
  const { totalUsdc, loading } = useAggregatePersonalBalance();
  const { t } = useT();
  const rise = useRise();
  const signIn = useSignIn();

  if (!ready) return null;

  // Signed out there is no profile and no money — so the page is the ask.
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-[800px] pb-32">
        <motion.section
          {...rise(0)}
          className="mt-10 rounded-card border border-ink/10 bg-paper p-6 text-center"
        >
          <p className="text-sm text-ink/45">{t("guest.you.body")}</p>
          <button
            type="button"
            onClick={signIn}
            className="mt-4 rounded-full bg-ink px-6 py-2.5 text-[14px] lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85"
          >
            {t("common.signIn")}
          </button>
        </motion.section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] pb-32">

      {totalUsdc === 0 && !loading ? (
        <motion.section
          {...rise(1)}
        >
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
        </motion.section>
      ) : (
        <ProfileMoney wallet={<MoneyPanel />} />
      )}
    </div>
  );
}
