import type { Metadata } from "next";

import { dmSans } from "@/components/landing-v2/fonts";
import { LandingShell } from "@/components/landing-v2/landing-shell";

export const metadata: Metadata = {
  title: "OXAR. — where your money sleeps",
};

/**
 * The landing. A one-time dark hero gate, then light/grey editorial content
 * sections → black waitlist + footer, in strict Swiss-typographic minimalism.
 */
export default function Home() {
  return (
    <div className={`${dmSans.variable} ${dmSans.className} bg-white`}>
      <LandingShell />
    </div>
  );
}
