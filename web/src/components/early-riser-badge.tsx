"use client";

import { useEffect, useState } from "react";
import { Sunrise } from "lucide-react";

import { useT } from "@/lib/i18n";
import { isEarlyRiser } from "@/lib/badge/early-riser";

/**
 * Honorary "Early Riser" mark for people who were in during the closed alpha.
 * Cosmetic only — no token, no promise. Renders nothing if not earned.
 *
 * It used to be a medallion the size of a card, sitting in a section of its own,
 * which gave a decoration more of the page than anything a person came to do. A
 * badge belongs beside the name it decorates, at the size of a name.
 */
export function EarlyRiserBadge() {
  const { t } = useT();
  // Resolve on the client only — the check reads localStorage, so avoid an SSR mismatch.
  const [earned, setEarned] = useState(false);
  useEffect(() => setEarned(isEarlyRiser()), []);

  if (!earned) return null;

  return (
    <span
      title={t("badge.earlyRiser.subtitle")}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#3c05c7]/20 bg-[#3c05c7]/[0.06] px-2 py-0.5 text-[10px] lowercase tracking-wide text-[#3c05c7]"
    >
      <Sunrise size={11} strokeWidth={1.8} />
      {t("badge.earlyRiser.title")}
    </span>
  );
}
