import type { Metadata } from "next";
import { PitchHero } from "@/components/pitch/pitch-hero";
import { PitchCards } from "@/components/pitch/pitch-cards";
import { PitchCurrencies } from "@/components/pitch/pitch-currencies";
import { PitchManifesto } from "@/components/pitch/pitch-manifesto";

export const metadata: Metadata = {
  title: "OXAR — Pitch",
  description:
    "OXAR tokenizes emerging market government bonds. We're starting in Ukraine — and we're going global.",
};

export default function PitchPage() {
  return (
    <main className="h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-black text-white scroll-smooth [&>section]:snap-start [&>section]:snap-always">
      <PitchHero />
      <PitchCards />
      <PitchCurrencies />
      <PitchManifesto />
    </main>
  );
}
