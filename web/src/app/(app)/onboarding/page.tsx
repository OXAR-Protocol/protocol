"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { Wallet, Smartphone, ArrowRight } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { useT } from "@/lib/i18n";

export default function OnboardingPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();
  const { t } = useT();

  useEffect(() => {
    if (ready && authenticated) router.replace("/home");
  }, [ready, authenticated, router]);

  return (
    <div className="mx-auto max-w-[1000px] pb-32 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>{t("onb.label")}</SectionLabel>
        <h1 className="mt-4 max-w-2xl text-[clamp(28px,4.4vw,48px)] leading-[1.04] tracking-[-0.04em]">
          {t("onb.title")}
        </h1>
        <p className="mt-3 max-w-md lowercase text-[clamp(15px,1.3vw,18px)] text-black/45">
          {t("onb.subtitle")}
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {/* Wallet */}
        <button
          onClick={() => login()}
          disabled={!ready}
          className="rounded-[14px] border border-black/10 bg-white p-8 text-left transition-colors hover:border-black/30 disabled:opacity-50"
        >
          <Wallet className="mb-6 text-black/50" size={30} strokeWidth={1.5} />
          <h2 className="lowercase text-[clamp(20px,2.2vw,26px)] tracking-[-0.02em]">{t("onb.crypto.title")}</h2>
          <p className="mt-2 lowercase text-[clamp(14px,1.2vw,16px)] leading-snug text-black/50">
            {t("onb.crypto.body")}
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 lowercase text-[14px] font-medium text-[#3c05c7]">
            {t("onb.connect")}
            <ArrowRight size={15} strokeWidth={1.75} />
          </div>
        </button>

        {/* Apple Pay / Google Pay (coming soon) */}
        <div className="rounded-[14px] border border-black/10 bg-white p-8 text-left opacity-80">
          <Smartphone className="mb-6 text-black/50" size={30} strokeWidth={1.5} />
          <h2 className="lowercase text-[clamp(20px,2.2vw,26px)] tracking-[-0.02em]">{t("onb.phone.title")}</h2>
          <p className="mt-2 lowercase text-[clamp(14px,1.2vw,16px)] leading-snug text-black/50">
            {t("onb.phone.body")}
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1 lowercase text-[12px] tracking-wide text-black/45">
            {t("onb.comingMvp")}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 lowercase text-[13px] text-black/35"
      >
        <span>{t("onb.chip1")}</span>
        <span className="opacity-50">·</span>
        <span>{t("onb.chip2")}</span>
        <span className="opacity-50">·</span>
        <span>{t("onb.chip3")}</span>
        <span className="opacity-50">·</span>
        <span>{t("onb.chip4")}</span>
      </motion.section>
    </div>
  );
}
