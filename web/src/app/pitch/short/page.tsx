import type { Metadata } from "next";

import { DeckShell } from "@/components/pitch/deck-shell";
import { VisualDeck } from "@/components/pitch/deck-visual";

export const metadata: Metadata = {
  title: "OXAR — Pitch (short)",
  description:
    "OXAR — a non-custodial savings app on Solana. The twelve-slide deck: one image, one line, meant to be presented over.",
  // Unlisted: anyone with the link can view; search engines don't index it.
  robots: { index: false, follow: false },
};

/** The short deck — the version to talk over. The long one, which reads without
 *  narration, lives at /pitch. */
export default function PitchShortPage() {
  return (
    <DeckShell>
      <VisualDeck />
    </DeckShell>
  );
}
