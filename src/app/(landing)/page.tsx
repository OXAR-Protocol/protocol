import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { Solution } from "@/components/landing/solution";
import { VaultShowcase } from "@/components/landing/vault-showcase";
import { TrustSection } from "@/components/landing/trust-section";
import { ForWhom } from "@/components/landing/for-whom";
import { TechSection } from "@/components/landing/tech-section";
import { Roadmap } from "@/components/landing/roadmap";
import { SocialProof } from "@/components/landing/social-proof";
import { CTAFooter } from "@/components/landing/cta-footer";

export default function LandingPage() {
  return (
    <main>
      <LandingNavbar />
      <Hero />
      <Problem />
      <Solution />
      <VaultShowcase />
      <TrustSection />
      <ForWhom />
      <TechSection />
      <Roadmap />
      <SocialProof />
      <CTAFooter />
    </main>
  );
}
