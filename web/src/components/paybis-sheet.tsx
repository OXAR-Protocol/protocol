"use client";

import type { ReactNode } from "react";

import { SheetShell } from "@/components/sheet-shell";

/** The Paybis legs use the shared money-sheet shell — kept as its own name because
 *  both walkthroughs read better with the vendor said out loud at the call site. */
export function PaybisSheet({
  label,
  title,
  onClose,
  children,
}: {
  label: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <SheetShell label={label} title={title} onClose={onClose}>
      {children}
    </SheetShell>
  );
}
