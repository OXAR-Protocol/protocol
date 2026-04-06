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

export default function Home() {
  return (
    <WarpProvider>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Vaults />
        <Features />
        <ForWhom />
        <Tech />
        <Roadmap />

      </main>
      <Footer />
    </WarpProvider>
  );
}
