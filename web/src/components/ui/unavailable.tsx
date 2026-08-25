"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

/**
 * What a block looks like when we could not load it.
 *
 * The third state, and the app only had two. A request that failed produced an empty
 * array, an empty array rendered as the empty state, and the empty state is a
 * confident sentence: "you have no history", "you have earned nothing", "you have
 * made no trades". All three were reported, and all three were the network.
 *
 * So a block that does not know says it does not know. The shape stays — same size,
 * same place, so nothing below it jumps when the answer arrives — and it keeps the
 * pulse of something still in flight rather than the stillness of something settled,
 * because on the next load it usually does arrive.
 */
export function Unavailable({
  className = "",
  /** Roughly what the real content occupies, so the page does not resize twice. */
  height = "h-[92px]",
}: {
  className?: string;
  height?: string;
}) {
  const { t } = useT();
  return (
    <div className={`relative ${className}`}>
      <Skeleton className={`w-full ${height}`} />
      <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-[12px] leading-snug text-ink/40">
        {t("common.couldntLoad")}
      </p>
    </div>
  );
}
