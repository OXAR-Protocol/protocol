"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";

import { EarlyRiserBadge } from "@/components/early-riser-badge";
import { SettingsSheet } from "@/components/settings-sheet";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useSolanaContext } from "@/providers/solana-provider";
import { useSolanaName } from "@/hooks/use-solana-name";
import { MetalAvatar } from "@/components/metal-avatar";
import { useT } from "@/lib/i18n";

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
  const { positionCount } = useAggregatePersonalBalance();
  const address = walletAddress?.toBase58() ?? user?.wallet?.address ?? null;
  const solName = useSolanaName(address);
  const email = user?.email?.address;

  // A name, in order of how much it says about the person: their .sol, their email
  // handle, then — failing both — the address itself.
  const named = solName ?? (email ? email.split("@")[0]! : null);
  const short = address ? `${address.slice(0, 6)}…${address.slice(-6)}` : null;
  const name = named ?? short ?? "you";

    const [showSettings, setShowSettings] = useState(false);
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  // Morning / afternoon / evening — the way an account greets someone, rather than
  // the way a ledger identifies them.
  const hour = new Date().getHours();
  const greeting = t(hour < 12 ? "profile.morning" : hour < 18 ? "profile.afternoon" : "profile.evening");

  return (
    <section data-tour="account">
      <div className="flex items-center gap-3">
        <MetalAvatar seed={address ?? name} size={40} />
        <div className="min-w-0">
          {/* The wallet address used to be the h1 of this page, at 32px, above the
              money. For the audience this product is FOR — people who have never held
              a private key — that is a screen that opens with a machine identifier
              and buries the one number they came for. A bank opens with the balance
              and says hello.

              `named` is the .sol or the email handle; when there is neither (a wallet
              login with no name attached) the greeting simply stands alone. What it
              never falls back to is the address: an identifier nobody can read is not
              a name, and it has a home in the receive sheet where it is actually used. */}
          <p className="truncate text-[15px] lowercase tracking-[-0.01em] text-ink/55">
            {named ? `${greeting}, ${named}` : greeting}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <EarlyRiserBadge />
          {/* Settings live behind the gear: a page you open to see what you're worth
              shouldn't end in configuration. */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label={t("settings.title")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/45 transition active:scale-[0.97] hover:border-ink/30 hover:text-ink"
          >
            <Settings size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="mb-6 mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12px] text-ink/50">
        {/* What's working and what's free now sit under the balance, beside the
            number they describe. Three icons for three unrelated facts was
            decoration, so the icons went with them. */}
        <span>{t("profile.positions", { n: String(positionCount) })}</span>
        {joined && <span>{t("profile.joined", { date: joined })}</span>}
      </div>

      <AnimatePresence>
        {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

    </section>
  );
}

