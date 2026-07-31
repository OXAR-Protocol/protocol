"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * One picked set for a whole page.
 *
 * The browse page shows yield sources, stocks and gold in three separate sections.
 * If each owned its own selection you'd get three bars fighting over the bottom of
 * the screen and three answers to "what have I picked" — so the set lives above
 * them, and a section only offers its own ids to it.
 */
interface PickSet {
  picked: ReadonlySet<string>;
  toggle: (id: string) => void;
  /** Trade one pick for another — the same basket slot, a different market. */
  swap: (from: string, to: string) => void;
  clear: () => void;
  /** Off when the feature is dark — sections then render no pick control at all. */
  enabled: boolean;
}

const Ctx = createContext<PickSet | null>(null);

export function PickSetProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const value = useMemo<PickSet>(
    () => ({
      picked,
      enabled,
      toggle: (id) =>
        setPicked((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      swap: (from, to) =>
        setPicked((prev) => {
          if (!prev.has(from) || from === to) return prev;
          const next = new Set(prev);
          next.delete(from);
          next.add(to);
          return next;
        }),
      clear: () => setPicked(new Set()),
    }),
    [picked, enabled],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Null outside a provider, so a section can render without one. */
export function usePickSet(): PickSet | null {
  return useContext(Ctx);
}
