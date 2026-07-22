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
    <div className="relative overflow-hidden rounded-[16px] border border-[#3c05c7]/15 bg-gradient-to-br from-[#3c05c7]/[0.08] via-[#3c05c7]/[0.03] to-transparent p-5">
      {/* soft glow behind the medallion */}
      <div className="pointer-events-none absolute -left-6 -top-8 h-32 w-32 rounded-full bg-[#3c05c7]/15 blur-2xl" />
      <div className="relative flex items-center gap-4">
        {/* medallion */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3c05c7] to-[#7b4dff] text-white shadow-[0_8px_24px_rgba(60,5,199,0.35)] ring-4 ring-[#3c05c7]/10">
          <Sunrise size={24} strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[17px] font-semibold tracking-[-0.01em] text-black">
              {t("badge.earlyRiser.title")}
            </p>
            <span className="rounded-full bg-[#3c05c7]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#3c05c7]">
              {t("badge.earlyRiser.tag")}
            </span>
          </div>
          <p className="mt-1 text-xs leading-snug text-black/50">
            {t("badge.earlyRiser.subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
