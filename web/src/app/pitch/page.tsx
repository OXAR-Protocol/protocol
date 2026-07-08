import type { Metadata } from "next";

import { dmSans } from "@/components/landing-v2/fonts";
import { Deck } from "@/components/pitch/deck";

export const metadata: Metadata = {
  title: "OXAR — Pitch",
  description:
    "OXAR — a non-custodial savings app on Solana. A dollar account that earns for the people banks and brokers left out. Tokenized treasuries, credit, stocks and gold in one account.",
};

export default function PitchPage() {
  return (
    <main className={`${dmSans.variable} ${dmSans.className} h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-black text-white scroll-smooth [&>section]:snap-start [&>section]:snap-always`}>
      <Deck />
    </main>
  );
}
