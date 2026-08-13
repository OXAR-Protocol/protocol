"use client";

import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence } from "framer-motion";
import { Check, Clock, Copy, Layers, Settings, Wallet } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { EarlyRiserBadge } from "@/components/early-riser-badge";
import { SettingsSheet } from "@/components/settings-sheet";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useSolanaContext } from "@/providers/solana-provider";
import { useSolanaName } from "@/hooks/use-solana-name";
import { useT } from "@/lib/i18n";

/** Four brand-adjacent plates; the address picks one, so it's the same every visit. */
const PLATES = ["bg-[#3c05c7]", "bg-black", "bg-[#b45309]", "bg-[#065f46]"] as const;

function plateFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PLATES[hash % PLATES.length]!;
}

/**
 * Who you are here, at the top of your own page.
 *
 * The settings page opened on a label and a list of fields, which reads like a form
 * rather than an account. This is the same information given a face: the name you
 * go by, the address behind it, and the three facts worth stating — what's working,
 * how many positions, and since when.
 *
 * The money buttons sit here for the same reason they sit by the wallet on the
 * portfolio: a figure invites an act, and both acts are one tap from it.
 */
export function ProfileHeader() {
  const { t } = useT();
  const { user } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const { totalUsdc, positionCount } = useAggregatePersonalBalance();

  const address = walletAddress?.toBase58() ?? user?.wallet?.address ?? null;
  const solName = useSolanaName(address);
  const email = user?.email?.address;

  // A name, in order of how much it says about the person: their .sol, their email
  // handle, then the address they signed in with.
  const name =
    solName ?? (email ? email.split("@")[0]! : address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "you");
  // Always the address, never the email: the line under a name exists to be copied
  // into a wallet or an exchange's withdrawal field, and an email can't receive money.
  const secondary = address ? `${address.slice(0, 6)}…${address.slice(-6)}` : null;
  const plate = useMemo(() => plateFor(address ?? name), [address, name]);

  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  return (
    <section data-tour="account">
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[24px] uppercase text-white ${plate}`}
        >
          {name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[clamp(22px,3vw,32px)] leading-tight tracking-[-0.03em] text-black">
              {name}
            </h1>
            <EarlyRiserBadge />
          </div>
          {/* The address is here to be taken somewhere — a wallet, an exchange's
              withdrawal field — so tapping it copies rather than selects. */}
          {secondary && (
            <button
              type="button"
              onClick={copyAddress}
              disabled={!address}
              aria-label={t("fund.copyAddress")}
              className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-[13px] text-black/45 transition enabled:hover:text-black"
            >
              <span className="truncate">{secondary}</span>
              {copied ? (
                <Check size={12} strokeWidth={2} className="shrink-0 text-[#3c05c7]" />
              ) : (
                <Copy size={12} strokeWidth={1.5} className="shrink-0 text-black/30" />
              )}
            </button>
          )}
        </div>

        {/* Settings live behind the gear: a page you open to see what you're worth
            shouldn't end in configuration. */}
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          aria-label={t("settings.title")}
          className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-black/45 transition hover:border-black/30 hover:text-black"
        >
          <Settings size={17} strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-black/50">
        <Stat icon={Wallet} text={t("profile.working", { value: `$${formatUsdAmount(totalUsdc)}` })} />
        <Stat icon={Layers} text={t("profile.positions", { n: String(positionCount) })} />
        {joined && <Stat icon={Clock} text={t("profile.joined", { date: joined })} />}
      </div>

      <AnimatePresence>
        {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

    </section>
  );
}

function Stat({ icon: Icon, text }: { icon: typeof Wallet; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={13} strokeWidth={1.5} className="text-black/30" />
      {text}
    </span>
  );
}
