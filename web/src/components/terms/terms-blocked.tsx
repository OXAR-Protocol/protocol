"use client";

import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";

import { useT } from "@/lib/i18n";
import { LanguageChips } from "@/components/language-picker";

/**
 * Where a decline lands. Deliberately a dead end for the app itself — the
 * gate is a gate, not a dismissible notice — but not a dead end for the
 * person: they can reopen the terms (most declines are "I clicked the wrong
 * button" or "let me actually read this"), or sign out if they mean it.
 */
export function TermsBlocked({ onReviewTerms }: { onReviewTerms: () => void }) {
  const { t } = useT();
  const { logout } = usePrivy();

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-[60] flex items-center justify-center bg-white px-6 text-center text-black">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex max-w-[380px] flex-col items-center"
      >
        <div className="mb-6">
          <LanguageChips />
        </div>
        <p className="text-[17px] leading-snug text-black">{t("terms.gate.blockedTitle")}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-black/50">{t("terms.gate.blockedBody")}</p>

        <button
          type="button"
          onClick={onReviewTerms}
          className="mt-7 rounded-full bg-black px-6 py-3 text-[13px] lowercase tracking-wide text-white transition hover:bg-black/85"
        >
          {t("terms.gate.reviewTerms")}
        </button>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-3 text-[12px] lowercase tracking-wide text-black/40 transition hover:text-black"
        >
          {t("terms.gate.signOut")}
        </button>
      </motion.div>
    </div>
  );
}
