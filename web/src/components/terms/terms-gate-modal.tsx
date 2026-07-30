"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

import { TERMS_VERSION } from "@oxar/sdk";
import { useT } from "@/lib/i18n";
import { TERMS_SECTIONS } from "@/components/terms/terms-sections";

const TERMS_DATE = new Date(`${TERMS_VERSION}T00:00:00Z`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface Props {
  walletAddress: string;
  onAgree: () => void;
  onDecline: () => void;
}

/**
 * The gate itself: the terms prose read in-app (never off-domain — see
 * `terms-sections.tsx`, the single source shared with `/terms`), scrollable,
 * with jump chips for the section headings, a wallet address in the header so
 * it's visible what's accepting, and a checkbox that must be ticked before
 * "agree" is even clickable.
 *
 * z-[60] + the safe-area bottom padding on the footer mirror
 * `allocation-sheet.tsx` — same problem (a fixed tab bar + the home
 * indicator eating the bottom of the screen on a phone), same fix.
 */
export function TermsGateModal({ walletAddress, onAgree, onDecline }: Props) {
  const { t } = useT();
  const [agreed, setAgreed] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[20px] border border-black/10 bg-white sm:rounded-[20px]"
      >
        <div className="border-b border-black/10 px-5 pb-3 pt-5">
          <p className="text-[15px] text-black">{t("terms.gate.title")}</p>
          <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-black/45">
            {t("terms.gate.forWallet", { addr: walletAddress })}
          </p>

          <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {TERMS_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="shrink-0 rounded-full bg-black/[0.05] px-3 py-1 text-[11px] lowercase tracking-wide text-black/55 transition hover:text-black"
              >
                {s.short}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4 text-[13px] leading-relaxed text-black/60 [&_a]:text-[#3c05c7] [&_a]:underline [&_h3]:mb-1.5 [&_h3]:text-[14px] [&_h3]:font-medium [&_h3]:text-black [&_strong]:font-medium [&_strong]:text-black">
          {TERMS_SECTIONS.map((s) => (
            <div key={s.id} ref={(el) => { sectionRefs.current[s.id] = el; }}>
              <h3>{s.heading}</h3>
              {s.body}
            </div>
          ))}
        </div>

        <div className="border-t border-black/10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <label className="flex items-start gap-2.5 text-[12px] leading-snug text-black/60">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-black"
            />
            {t("terms.gate.checkbox")}
          </label>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onDecline}
              className="text-[12px] lowercase tracking-wide text-black/40 transition hover:text-black"
            >
              {t("terms.gate.decline")}
            </button>
            <button
              type="button"
              disabled={!agreed}
              onClick={onAgree}
              className="rounded-full bg-black px-5 py-2.5 text-[13px] lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-30"
            >
              {t("terms.gate.agree")}
            </button>
          </div>

          <p className="mt-3 text-center text-[10px] text-black/35">
            {t("terms.gate.footer", { version: TERMS_VERSION, date: TERMS_DATE, email: "support@oxar.app" })}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
