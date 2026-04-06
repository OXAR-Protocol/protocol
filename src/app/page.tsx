import { Header } from "@/sections/header";
import { Hero } from "@/sections/hero";
import { Problem } from "@/sections/problem";
import { HowItWorks } from "@/sections/how-it-works";
import { Vaults } from "@/sections/vaults";
import { Features } from "@/sections/features";
import { ForWhom } from "@/sections/for-whom";
import { Tech } from "@/sections/tech";
import { Roadmap } from "@/sections/roadmap";

import { Footer } from "@/sections/footer";
import { WarpProvider } from "@/components/warp-transition";
import { SectionDivider } from "@/components/section-divider";

export default function Home() {
  return (
    <WarpProvider>
      <Header />
      <main>
        <Hero />
        <SectionDivider />
        <Problem />
        <SectionDivider />
        <HowItWorks />
        <SectionDivider />
        <Vaults />
        <SectionDivider />
        <Features />
        <SectionDivider />
        <ForWhom />
        <SectionDivider />
        <Tech />
        <SectionDivider />
        <Roadmap />
      </main>
      <Footer />
    </WarpProvider>
  );
}
