"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { ProfileHeader } from "@/components/profile-header";
import { ProfileMoney } from "@/components/profile-money";
import { WalletCash } from "@/components/wallet-cash";
import { PhotoBg } from "@/components/photo-bg";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useSignIn } from "@/hooks/use-sign-in";
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
  const signIn = useSignIn();

  if (!ready) return null;

  // Signed out there is no profile and no money — so the page is the ask.
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-[800px] pb-32">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-10 rounded-[12px] border border-black/10 bg-white p-6 text-center"
        >
          <p className="text-sm text-black/45">{t("guest.you.body")}</p>
          <button
            type="button"
            onClick={signIn}
            className="mt-4 rounded-full bg-black px-6 py-2.5 text-[14px] lowercase tracking-wide text-white transition hover:bg-black/85"
          >
            {t("common.signIn")}
          </button>
        </motion.section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] pb-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-2"
      >
        <ProfileHeader />
      </motion.div>

      {/* What you can act on right now, and the two doors that change it. */}
      <div className="mt-8">
        <WalletCash />
      </div>

      {totalUsdc === 0 && !loading ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative overflow-hidden rounded-[16px] border border-black/10 bg-white">
            <PhotoBg src="/art/coin-stacking.webp" scrim="left" position="object-right" />
            <div className="relative p-8 md:p-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3c05c7]/30 bg-[#3c05c7]/10 px-2 py-1 text-[10px] lowercase tracking-widest text-[#3c05c7]">
                <Sparkles size={10} strokeWidth={1.5} />
                {t("home.startHere")}
              </span>
              <h2 className="mt-4 text-2xl leading-tight lowercase text-black md:text-3xl">
                {t("home.napping1")}
                <br />
                <span className="text-black/55">{t("home.napping2")}</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-black/55">{t("home.empty.body")}</p>
              <Link
                href="/market"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-[14px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85"
              >
                {t("home.wakeUp")}
                <ArrowUpRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </motion.section>
      ) : (
        <ProfileMoney />
      )}
    </div>
  );
}
