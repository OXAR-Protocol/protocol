"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";

import { EarlyRiserBadge } from "@/components/early-riser-badge";
import { SettingsSheet } from "@/components/settings-sheet";
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
 * The gear is the button. It briefly wasn't — the metal disc took over for a day —
 * and that was wrong for a reason worth keeping: a bank can make the avatar the
 * settings control because the avatar is your face. Ours carries the OXAR mark,
 * identical for every account bar the metal finish, so it reads as the product's
 * badge, not as your account. A badge is not an affordance. The disc moved to the
 * wallet pill in the top bar, where being decorative is the whole job.
 *
 * `2 positions` went with the greeting: the list further down this same page is that
 * fact, in more detail, without having been asked.
 */
export function ProfileHeader() {
  const { t } = useT();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <EarlyRiserBadge />
        {/* A gear, because a gear means settings.
            The metal disc stood here for a day and it could not do this job: it
            carries the OXAR mark, identical for everyone bar the finish, so it reads
            as our logo rather than as your account. A bank can make the avatar the
            button because the avatar is your face. Ours is our badge, and a badge is
            not an affordance. */}
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          aria-label={t("settings.title")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/45 transition active:scale-[0.97] hover:border-ink/30 hover:text-ink"
        >
          <Settings size={16} strokeWidth={1.5} />
        </button>
      </div>

      <AnimatePresence>
        {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </>
  );
}
