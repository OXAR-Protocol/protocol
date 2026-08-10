import type { Metadata } from "next";

import { Deck } from "@/components/pitch/deck";
import { DeckShell } from "@/components/pitch/deck-shell";

export const metadata: Metadata = {
  title: "OXAR — Pitch",
  description:
    "OXAR — a non-custodial savings app on Solana. A dollar account that earns for the people banks and brokers left out. Tokenized treasuries, credit, stocks and gold in one account.",
  // Unlisted: anyone with the link can view; search engines don't index it.
  robots: { index: false, follow: false },
};

export default function PitchPage() {
  return (
    <DeckShell>
      <Deck />
    </DeckShell>
  );
}
