"use client";

import { motion } from "framer-motion";

import { SectionLabel } from "@/components/section-label";
import { useSignIn } from "@/hooks/use-sign-in";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/en";

/**
 * A page that belongs to an account, shown to someone who doesn't have one yet.
 *
 * It is not an error and not a redirect: the tab is reachable, it simply has
 * nothing personal to show, so it says what would be here and offers the way in.
 */
export function GuestEmpty({
  label,
  title,
  body,
}: {
  label: string;
  title: TranslationKey;
  body: TranslationKey;
}) {
  const { t } = useT();
  const signIn = useSignIn();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-[800px] pt-8 pb-32"
    >
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-10 rounded-[12px] border border-black/10 bg-white p-8 text-center">
        <p className="text-[clamp(18px,2.2vw,24px)] lowercase leading-snug text-black">
          {t(title)}
        </p>
        <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-snug text-black/45">
          {t(body)}
        </p>
        <button
          type="button"
          onClick={signIn}
          className="mt-6 rounded-full bg-black px-6 py-3 text-[14px] lowercase tracking-wide text-white transition hover:bg-black/85"
        >
          {t("common.signIn")}
        </button>
      </div>
    </motion.div>
  );
}
