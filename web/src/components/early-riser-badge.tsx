"use client";

import { useEffect, useState } from "react";
import { Sunrise } from "lucide-react";

import { isEarlyRiser } from "@/lib/badge/early-riser";
import { useT } from "@/lib/i18n";

/**
 * Honorary "Early Riser" badge shown in the profile for people who were in during the
 * closed alpha. Cosmetic only — no token, no promise. See lib/badge/early-riser.ts.
 * Renders nothing for anyone who doesn't qualify (i.e. joined after public launch).
 */
export function EarlyRiserBadge() {
  const { t } = useT();
  // Resolve on the client only — the check reads localStorage, so avoid an SSR mismatch.
  const [earned, setEarned] = useState(false);
  useEffect(() => setEarned(isEarlyRiser()), []);

  if (!earned) return null;

  return (
    <div className="flex items-center gap-3 rounded-[5px] border border-[#3c05c7]/20 bg-[#3c05c7]/[0.04] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3c05c7]/10 text-[#3c05c7]">
        <Sunrise size={16} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium lowercase tracking-[-0.01em] text-black">
          {t("badge.earlyRiser.title")}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-black/45">
          {t("badge.earlyRiser.subtitle")}
        </p>
      </div>
    </div>
  );
}
