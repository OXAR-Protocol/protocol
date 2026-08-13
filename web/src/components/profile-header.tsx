"use client";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Clock, Layers, Wallet } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { MoneyActions } from "@/components/money-actions";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
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
  const { assets } = useWalletAssets();
  // What's free to act on right now — the figure the plus changes.
  const free = assets.reduce((sum, a) => sum + a.usdValue, 0);

  const address = walletAddress?.toBase58() ?? user?.wallet?.address ?? null;
  const solName = useSolanaName(address);
  const email = user?.email?.address;

  // A name, in order of how much it says about the person: their .sol, their email
  // handle, then the address they signed in with.
  const name =
    solName ?? (email ? email.split("@")[0]! : address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "you");
  const secondary = email ?? (address ? `${address.slice(0, 6)}…${address.slice(-6)}` : null);
  const plate = useMemo(() => plateFor(address ?? name), [address, name]);

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[24px] uppercase text-white ${plate}`}
        >
          {name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[clamp(22px,3vw,32px)] leading-tight tracking-[-0.03em] text-black">
            {name}
          </h1>
          {secondary && <p className="mt-0.5 truncate text-[13px] text-black/45">{secondary}</p>}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-black/50">
        <Stat icon={Wallet} text={t("profile.working", { value: `$${formatUsdAmount(totalUsdc)}` })} />
        <Stat icon={Layers} text={t("profile.positions", { n: String(positionCount) })} />
        {joined && <Stat icon={Clock} text={t("profile.joined", { date: joined })} />}
      </div>

      {/* The same two doors as the portfolio — money in, and everything else. */}
      <div className="mt-6 flex items-center justify-between gap-4 rounded-[12px] border border-black/10 bg-white px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] lowercase tracking-wide text-black/40">{t("money.free")}</p>
          <p className="mt-0.5 text-[20px] tabular-nums text-black">${formatUsdAmount(free)}</p>
        </div>
        <MoneyActions />
      </div>
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
