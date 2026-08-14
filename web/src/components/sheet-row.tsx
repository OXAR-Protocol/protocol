"use client";

import type { ReactNode } from "react";
import { ChevronRight, Loader2, type LucideIcon } from "lucide-react";

/**
 * One choice in a sheet, and the only shape they come in.
 *
 * Each sheet grew its own row, so the same list of options changed height from
 * screen to screen depending on whether a description ran to two lines, and the
 * icons drifted between sizes and weights. Boxes of different heights beside each
 * other read as a mistake rather than a difference.
 *
 * So: a fixed height, and the icon set in a soft round plate — the same footprint
 * whether the glyph inside is a card, a wallet or a token logo, which is what keeps
 * a column of them looking like a column.
 */
export function SheetRow({
  icon: Icon,
  leading,
  title,
  body,
  badge,
  trailing,
  busy,
  chevron = true,
  disabled,
  onClick,
}: {
  /** Lucide glyph for the plate. Omit when passing `leading` (e.g. a token logo). */
  icon?: LucideIcon;
  /** Anything else to sit in the plate's place, already sized 40×40. */
  leading?: ReactNode;
  title: string;
  body?: string;
  /** Small pill on the right — "soon", a count, a state. */
  badge?: string;
  /** Right-hand content that replaces the chevron (an amount, say). */
  trailing?: ReactNode;
  busy?: boolean;
  /** Off for rows that don't lead anywhere (an inert "soon" line). */
  chevron?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const inert = !onClick;
  const Tag = inert ? "div" : "button";

  return (
    <Tag
      {...(inert ? {} : { type: "button" as const, onClick, disabled: disabled || busy })}
      className={`flex min-h-[76px] w-full items-center gap-3 rounded-[12px] border border-ink/12 px-4 py-3 text-left transition ${
        inert
          ? "cursor-default opacity-60"
          : "enabled:hover:border-ink/40 enabled:hover:bg-ink/[0.015] disabled:opacity-45"
      }`}
    >
      {leading ?? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/[0.045] text-ink/70">
          {Icon && <Icon size={18} strokeWidth={1.6} />}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block text-[14px] leading-tight text-ink">{title}</span>
        {body && <span className="mt-0.5 block text-[12px] leading-snug text-ink/45">{body}</span>}
      </span>

      {badge && (
        <span className="shrink-0 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[9px] lowercase tracking-wide text-ink/45">
          {badge}
        </span>
      )}

      {busy ? (
        <Loader2 size={16} className="shrink-0 animate-spin text-ink/35" />
      ) : (
        trailing ??
        (chevron && !inert ? (
          <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-ink/25" />
        ) : null)
      )}
    </Tag>
  );
}
