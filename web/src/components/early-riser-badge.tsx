"use client";

import { useEffect, useState } from "react";
import { Sunrise } from "lucide-react";

import { isEarlyRiser } from "@/lib/badge/early-riser";
import { useT } from "@/lib/i18n";

/**
 * Honorary "Early Riser" badge shown in the profile for people who were in during the
 * closed alpha. An earned-looking medallion (not a settings row) — cosmetic only, no
 * token, no promise. See lib/badge/early-riser.ts. Renders nothing if not earned.
 */
export function EarlyRiserBadge() {
  const { t } = useT();
  // Resolve on the client only — the check reads localStorage, so avoid an SSR mismatch.
  const [earned, setEarned] = useState(false);
  useEffect(() => setEarned(isEarlyRiser()), []);

  if (!earned) return null;

  return (
    <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-[16px] border border-[#3c05c7]/15 bg-gradient-to-b from-[#3c05c7]/[0.06] to-transparent px-6 py-7 text-center">
      {/* soft glow behind the medallion */}
      <div className="pointer-events-none absolute left-1/2 top-2 h-28 w-28 -translate-x-1/2 rounded-full bg-[#3c05c7]/20 blur-3xl" />
      {/* circular illustrated medallion — like a rank badge */}
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#3c05c7] to-[#7b4dff] text-white shadow-[0_10px_30px_rgba(60,5,199,0.4)] ring-4 ring-white ring-offset-2 ring-offset-[#3c05c7]/15">
        <Sunrise size={40} strokeWidth={1.6} />
      </div>
      <div className="relative">
        <p className="text-[20px] font-semibold tracking-[-0.01em] text-black">
          {t("badge.earlyRiser.title")}
        </p>
        <span className="mt-2 inline-block rounded-full bg-[#3c05c7]/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#3c05c7]">
          {t("badge.earlyRiser.tag")}
        </span>
        <p className="mx-auto mt-2 max-w-[240px] text-xs leading-snug text-black/50">
          {t("badge.earlyRiser.subtitle")}
        </p>
      </div>
    </div>
  );
}
