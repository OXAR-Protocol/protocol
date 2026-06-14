import type { Metadata } from "next";

import { dmSans } from "@/components/landing-v2/fonts";
import { Waitlist } from "@/components/landing-v2/waitlist";

export const metadata: Metadata = {
  title: "OXAR. — the waitlist",
};

/**
 * Standalone waitlist page — kept separate from the main landing so the
 * "take a seat" scratch section can be refined in isolation.
 */
export default function WaitlistPage() {
  return (
    <main className={`${dmSans.variable} ${dmSans.className} min-h-screen bg-black`}>
      <Waitlist />
    </main>
  );
}
