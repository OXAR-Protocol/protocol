import type { Metadata } from "next";

import { dmSans } from "@/components/landing-v2/fonts";
import { LandingShell } from "@/components/landing-v2/landing-shell";

export const metadata: Metadata = {
  title: "OXAR. — where your money sleeps",
};

/**
 * Editorial landing (Figma "инфа" + "футера"). A one-time dark hero gate, then
 * light/grey content sections → black footer, in strict Swiss-typographic
 * minimalism. The shell handles the gate; sections are composed inside it.
 */
export default function LandingPage() {
  return (
    <div className={`${dmSans.variable} ${dmSans.className} bg-white`}>
      <LandingShell />
    </div>
  );
}
