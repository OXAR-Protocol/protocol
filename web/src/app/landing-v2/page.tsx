import type { Metadata } from "next";
import { DiveExperience } from "./dive-experience";

export const metadata: Metadata = {
  title: "OXAR — Still Waters (prototype)",
  description:
    "Where does your money sleep? Non-custodial USDC yield on Solana.",
  robots: { index: false },
};

export default function LandingV2() {
  return <DiveExperience />;
}
