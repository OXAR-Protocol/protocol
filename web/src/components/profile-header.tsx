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
const PLATES = ["bg-[var(--brand)]", "bg-ink", "bg-[#b45309]", "bg-[#065f46]"] as const;

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
  // handle, then — failing both — the address itself.
  const named = solName ?? (email ? email.split("@")[0]! : null);
  const short = address ? `${address.slice(0, 6)}…${address.slice(-6)}` : null;
  const name = named ?? short ?? "you";
  // Only when the name ISN'T already the address. With no .sol and no email the
  // heading IS the address, and a second line under it said the same string twice
  // in two different truncations.
  const secondary = named ? short : null;
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
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[24px] uppercase text-paper ${plate}`}
        >
          {name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {named ? (
              <h1 className="truncate text-[clamp(22px,3vw,32px)] leading-tight tracking-[-0.03em] text-ink">
                {name}
              </h1>
            ) : (
              // The heading is the address, so it does the address's job: tap to copy.
              <button
                type="button"
                onClick={copyAddress}
                aria-label={t("fund.copyAddress")}
                className="group inline-flex max-w-full items-center gap-2 text-left"
              >
                <h1 className="truncate text-[clamp(22px,3vw,32px)] leading-tight tracking-[-0.03em] text-ink">
                  {name}
                </h1>
                {copied ? (
                  <Check size={15} strokeWidth={2} className="shrink-0 text-[var(--brand)]" />
                ) : (
                  <Copy
                    size={15}
                    strokeWidth={1.5}
                    className="shrink-0 text-ink/30 transition group-hover:text-ink/60"
                  />
                )}
              </button>
            )}
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
              className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-[13px] text-ink/45 transition enabled:hover:text-ink"
            >
              <span className="truncate">{secondary}</span>
              {copied ? (
                <Check size={12} strokeWidth={2} className="shrink-0 text-[var(--brand)]" />
              ) : (
                <Copy size={12} strokeWidth={1.5} className="shrink-0 text-ink/30" />
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
          className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/45 transition hover:border-ink/30 hover:text-ink"
        >
          <Settings size={17} strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink/50">
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
      <Icon size={13} strokeWidth={1.5} className="text-ink/30" />
      {text}
    </span>
  );
}
