"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";

import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();
  const { t } = useT();

  useEffect(() => {
    // The market, not the portfolio: a new account's portfolio is empty, and
    // the first thing anyone needs is somewhere to put money.
    if (ready && authenticated) router.replace("/market");
  }, [ready, authenticated, router]);

  // The access wall already approved this browser. Here we just authenticate —
  // email or a Solana wallet; the account is whichever you log in with.
  const handleLogin = () => {
    if (!ready || authenticated) return;
    login({ walletChainType: "solana-only" });
  };

  return (
    <div className="safe-top fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white px-6 text-black">
      <Link
        href="/"
        className="safe-top-6 absolute left-6 top-6 lowercase text-[14px] text-black/40 transition-colors hover:text-black"
      >
        {t("login.back")}
      </Link>

      <div className="relative flex max-w-[560px] flex-col items-center text-center">
        {/* The one place nothing said whose app this is — the page you land on before
            you have an account. Just the mark: the headline is already the wordmark's
            job, and a name under a name would read as a logo lockup nobody designed. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          {/* unoptimized: Next's image optimizer refuses SVG without
              `dangerouslyAllowSVG`, and this is our own static file. */}
          <Image src="/images/black.svg" alt="OXAR" width={56} height={60} priority unoptimized />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="lowercase text-[clamp(15px,1.4vw,18px)] text-black/45"
        >
          {t("login.welcome")}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-6 lowercase text-[clamp(38px,7vw,68px)] leading-[1.0] tracking-[-0.05em]"
        >
          {t("login.titleA")} <span className="italic text-black/45">{t("login.titleB")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 max-w-[420px] lowercase text-[clamp(15px,1.4vw,18px)] leading-snug text-black/50"
        >
          {t("login.body")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.44 }}
          className="mt-10 flex w-full max-w-[380px] flex-col items-center gap-3"
        >
          <button
            onClick={handleLogin}
            disabled={!ready || authenticated}
            className="w-full rounded-full bg-black px-8 py-3.5 lowercase text-[16px] font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30"
          >
            {authenticated ? t("login.redirecting") : t("login.continue")}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
