import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Ticker } from "@/components/landing/ticker";
import { Problem } from "@/components/landing/problem";
import { HowItWorks } from "@/components/landing/how-it-works";
import { VaultShowcase } from "@/components/landing/vault-showcase";
import { TrustAndAudience } from "@/components/landing/trust-and-audience";
import { Roadmap } from "@/components/landing/roadmap";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main>
      <LandingNavbar />
      <Hero />
      <Ticker />
      <Problem />
      <HowItWorks />
      <VaultShowcase />
      <TrustAndAudience />
      <Roadmap />
      <CTASection />
      <Footer />
    </main>
  );
}
