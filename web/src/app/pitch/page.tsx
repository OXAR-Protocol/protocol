import type { Metadata } from "next";
import { PitchHero } from "@/components/pitch/pitch-hero";
import { PitchCards } from "@/components/pitch/pitch-cards";
import { PitchAssets } from "@/components/pitch/pitch-assets";
import { PitchCurrencies } from "@/components/pitch/pitch-currencies";
import { PitchHow } from "@/components/pitch/pitch-how";
import { PitchModel } from "@/components/pitch/pitch-model";
import { PitchTraction } from "@/components/pitch/pitch-traction";
import { PitchManifesto } from "@/components/pitch/pitch-manifesto";

export const metadata: Metadata = {
  title: "OXAR — Pitch",
  description:
    "OXAR — the RWA hub on Solana. Tokenized equities, gold, government bonds and stablecoin lending in one non-custodial account. Pay with crypto or Apple Pay, from any chain.",
};

export default function PitchPage() {
  return (
    <main className="h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-black text-white scroll-smooth [&>section]:snap-start [&>section]:snap-always">
      <PitchHero />
      <PitchCards />
      <PitchAssets />
      <PitchCurrencies />
      <PitchHow />
      <PitchModel />
      <PitchTraction />
      <PitchManifesto />
    </main>
  );
}
