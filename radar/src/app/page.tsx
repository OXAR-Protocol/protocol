import type { Metadata } from "next";

import { Audience } from "./(landing)/audience";
import { CodeSnippet } from "./(landing)/code-snippet";
import { Coverage } from "./(landing)/coverage";
import { DemoPreview } from "./(landing)/demo-preview";
import { FaqFooter } from "./(landing)/faq-footer";
import { Hero } from "./(landing)/hero";
import { PricingTeaser } from "./(landing)/pricing-teaser";
import { TopBar } from "./(landing)/topbar";

export const metadata: Metadata = {
  title: "OXAR Radar — RWA intelligence layer for Ethereum and Solana",
  description:
    "Wallet analysis, protocol data, and AI-powered insights for the entire Real World Assets market. Pay in USDC, query in JSON, ship in minutes.",
  openGraph: {
    title: "OXAR Radar — RWA intelligence layer",
    description:
      "See every RWA. Across every chain. Before everyone else.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main>
        <Hero />
        <DemoPreview />
        <Audience />
        <Coverage />
        <PricingTeaser />
        <CodeSnippet />
        <FaqFooter />
      </main>
    </div>
  );
}
