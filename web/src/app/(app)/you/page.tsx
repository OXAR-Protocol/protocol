"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { Copy, Check, LogOut } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { LanguagePicker } from "@/components/language-picker";
import { useSolanaContext } from "@/providers/solana-provider";
import { useT } from "@/lib/i18n";

export default function YouPage() {
  const { user, logout, ready, authenticated } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const { t } = useT();
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const email = user?.email?.address;
  // The OXAR account wallet — your funds & positions live here (yield is on Solana).
  const solana = walletAddress?.toBase58() ?? user?.wallet?.address ?? null;

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
              copied={copiedAddr === solana}
              onCopy={() => handleCopy(solana)}
            />
          )}
          {!authenticated && (
            <div className="p-4 rounded-[12px] border border-black/10 bg-white text-center text-sm text-black/45">
              {t("you.signedOut")}
            </div>
          )}
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

function WalletCard({
  label,
  hint,
  address,
  copied,
  onCopy,
  dim,
}: {
  label: string;
  hint: string;
  address: string;
  copied: boolean;
  onCopy: () => void;
  dim?: boolean;
}) {
  const { t } = useT();
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-[5px] border ${
        dim ? "border-black/[0.06] bg-white/[0.02]" : "border-black/10"
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs lowercase tracking-wide text-black/40">{label}</p>
        <p className={`mt-1 text-sm ${dim ? "text-black/55" : "text-black"}`}>
          {`${address.slice(0, 6)}…${address.slice(-6)}`}
        </p>
        <p className="mt-1 text-[10px] text-black/40">{hint}</p>
      </div>
      <button
        onClick={onCopy}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-black/15 hover:border-black/30 text-[11px] lowercase tracking-wide text-black/60 hover:text-black transition"
      >
        {copied ? (
          <>
            <Check size={12} strokeWidth={1.5} />
            {t("common.copied")}
          </>
        ) : (
          <>
            <Copy size={12} strokeWidth={1.5} />
            {t("common.copy")}
          </>
        )}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-[5px] border border-black/10">
      <p className="text-xs lowercase tracking-wide text-black/40">
        {label}
      </p>
      <p className="mt-1 text-sm text-black">{value}</p>
    </div>
  );
}

