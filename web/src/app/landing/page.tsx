import type { Metadata } from "next";

import { dmSans } from "@/components/landing-v2/fonts";
import { Header } from "@/components/landing-v2/header";
import { Hero } from "@/components/landing-v2/hero";
import { Problem } from "@/components/landing-v2/problem";
import { HowItWorks } from "@/components/landing-v2/how-it-works";
import { Speeds } from "@/components/landing-v2/speeds";
import { Roadmap } from "@/components/landing-v2/roadmap";
import { Footer } from "@/components/landing-v2/footer";

export const metadata: Metadata = {
  title: "OXAR. — where your money sleeps",
};

/**
 * Editorial landing (Figma "инфа" + "футера"). Dark hero → light/grey
 * content sections → black footer, in strict Swiss-typographic minimalism.
 */
export default function LandingPage() {
  return (
    <div className={`${dmSans.variable} ${dmSans.className} bg-white`}>
      <Header />
      <Hero />
      <Problem />
      <HowItWorks />
      <Speeds />
      <Roadmap />
      <Footer />
    </div>
  );
}
