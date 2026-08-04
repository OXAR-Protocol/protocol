"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { LogOut, MessageSquare } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { Row, WalletCard } from "@/components/you-rows";
import { FeedbackSheet } from "@/components/feedback-sheet";
import { forgetIntro } from "@/components/intro-modal";
import { LanguagePicker } from "@/components/language-picker";
import { EarlyRiserBadge } from "@/components/early-riser-badge";
import { useSolanaContext } from "@/providers/solana-provider";
import { useSolanaName } from "@/hooks/use-solana-name";
import { useT } from "@/lib/i18n";

export default function YouPage() {
  const { user, logout, ready, authenticated } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const { t } = useT();
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const email = user?.email?.address;
  // The OXAR account wallet — your funds & positions live here (yield is on Solana).
  const solana = walletAddress?.toBase58() ?? user?.wallet?.address ?? null;
  const solName = useSolanaName(solana);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddr(address);
    setTimeout(() => setCopiedAddr(null), 1500);
  };

  if (!ready) return null;

  return (
    <div className="max-w-[800px] mx-auto pt-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>you</SectionLabel>
        <h1 className="mt-4 text-[clamp(26px,4vw,44px)] leading-[1.04] tracking-[-0.04em] lowercase text-black">
          {t("you.title")}
        </h1>
      </motion.div>

      {/* Account */}
      <motion.section
        data-tour="account"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-10"
      >
        <p className="mb-4 lowercase text-[clamp(13px,1.1vw,16px)] text-black/45">
          {t("you.account")}
        </p>
        <div className="space-y-3">
          {email && (
            <Row label={t("you.email")} value={email} />
          )}
          {solana && (
            <WalletCard
              label={t("you.wallet")}
              hint={t("you.walletHint")}
              address={solana}
              name={solName}
              copied={copiedAddr === solana}
              onCopy={() => handleCopy(solana)}
            />
          )}
          {!authenticated && (
            <div className="p-4 rounded-[12px] border border-black/10 bg-white text-center text-sm text-black/45">
              {t("you.signedOut")}
            </div>
          )}
          <EarlyRiserBadge />
        </div>
      </motion.section>

      {/* Language */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10"
      >
        <p className="mb-4 lowercase text-[clamp(13px,1.1vw,16px)] text-black/45">
          {t("you.language")}
        </p>
        <LanguagePicker />
      </motion.section>

      {/* Feedback. Sits above the legal fine print and below the settings people
          actually came for — a channel nobody can find is the same as no channel. */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-10"
      >
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="inline-flex items-center gap-2 rounded-[5px] border border-black/15 px-5 py-3 text-xs lowercase tracking-wide text-black/60 transition hover:border-black/40 hover:text-black"
        >
          <MessageSquare size={12} strokeWidth={1.5} />
          {t("you.feedback")}
        </button>
      </motion.section>

      {feedbackOpen && <FeedbackSheet onClose={() => setFeedbackOpen(false)} />}

      {/* Legal */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10"
      >
        {/* /terms is a marketing route (see middleware.ts) that only resolves on
         *  oxar.app, not app.oxar.app — an absolute URL + hard navigation, not
         *  next/link, so it actually lands instead of hitting the domain-split
         *  redirect mid client-side transition. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            href="https://oxar.app/terms"
            className="text-xs lowercase tracking-wide text-black/40 hover:text-black/60 transition"
          >
            {t("you.terms")}
          </a>
          {solana && (
            <button
              type="button"
              onClick={() => {
                forgetIntro(solana);
                // A reload rather than local state: the welcome is mounted up in
                // the app layout, so this page can't re-trigger it directly, and
                // landing on the portfolio is where the walkthrough starts anyway.
                window.location.href = "/portfolio";
              }}
              className="text-xs lowercase tracking-wide text-black/40 hover:text-black/60 transition"
            >
              {t("you.replayTour")}
            </button>
          )}
        </div>
      </motion.section>

      {/* Sign out */}
      {authenticated && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[5px] border border-black/15 hover:border-red-500/40 hover:text-red-400 text-xs lowercase tracking-wide text-black/60 transition"
          >
            <LogOut size={12} strokeWidth={1.5} />
            {t("you.signOut")}
          </button>
        </motion.section>
      )}
    </div>
  );
}
