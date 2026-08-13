"use client";

import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { LogOut } from "lucide-react";

import { ProfileHeader } from "@/components/profile-header";
import { ProfileMoney } from "@/components/profile-money";
import { forgetIntro } from "@/components/intro-modal";
import { LanguagePicker } from "@/components/language-picker";
import { useSolanaContext } from "@/providers/solana-provider";
import { useSignIn } from "@/hooks/use-sign-in";
import { useT } from "@/lib/i18n";

export default function YouPage() {
  const { user, logout, ready, authenticated } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const { t } = useT();
  const signIn = useSignIn();
  // The OXAR account wallet — your funds & positions live here (yield is on Solana).
  // Kept only for the tour reset below; the profile header shows and copies it.
  const solana = walletAddress?.toBase58() ?? user?.wallet?.address ?? null;

  if (!ready) return null;

  return (
    <div className="max-w-[800px] mx-auto pb-32">
      {/* Signed in, the page opens on who you are; signed out there is no profile to
          show, so the account section below does the asking. */}
      {authenticated && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ProfileHeader />
          <ProfileMoney />
        </motion.div>
      )}

      {/* Signed out there is no profile above, so this is the whole page: the ask,
          and the settings that work without an account. */}
      {!authenticated && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
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
      )}

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
