"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence } from "framer-motion";

import { EarlyRiserBadge } from "@/components/early-riser-badge";
import { SettingsSheet } from "@/components/settings-sheet";
import { useSolanaContext } from "@/providers/solana-provider";
import { useSolanaName } from "@/hooks/use-solana-name";
import { MetalAvatar } from "@/components/metal-avatar";
import { useT } from "@/lib/i18n";

/**
 * Who you are, reduced to the smallest thing that still works: a badge you earned,
 * and the way into your account.
 *
 * This block has lost, in order: the wallet address that used to be the page's h1,
 * the row of facts under it, and now the greeting that replaced the address. Each
 * went for the same reason — everything above the balance is something a person has
 * to read past to reach the number they opened the screen for. "Good afternoon" is
 * pleasant and says nothing, and a whole row of the page is a lot to spend on
 * pleasant.
 *
 * The avatar IS the button now. Two controls sat here — a metal disc that did
 * nothing and a gear beside it — where every banking app has exactly one: your face,
 * top right, which opens your account.
 *
 * `2 positions` went with the greeting: the list further down this same page is that
 * fact, in more detail, without having been asked.
 */
export function ProfileHeader() {
  const { t } = useT();
  const { user } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const address = walletAddress?.toBase58() ?? user?.wallet?.address ?? null;
  const solName = useSolanaName(address);
  const seed = address ?? solName ?? user?.email?.address ?? "you";

  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <EarlyRiserBadge />
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          aria-label={t("settings.title")}
          className="rounded-full transition active:scale-[0.97]"
        >
          <MetalAvatar seed={seed} size={38} />
        </button>
      </div>

      <AnimatePresence>
        {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </>
  );
}
