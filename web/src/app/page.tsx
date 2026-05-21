import { Header } from "@/sections/header";
import { Hero } from "@/sections/hero";
import { Problem } from "@/sections/problem";
import { HowItWorks } from "@/sections/how-it-works";
import { Vaults } from "@/sections/vaults";
import { Features } from "@/sections/features";
import { ForWhom } from "@/sections/for-whom";

import { Roadmap } from "@/sections/roadmap";
import { Waitlist } from "@/sections/waitlist";

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
        <Roadmap />
        <Waitlist />
      </main>
      <Footer />
    </WarpProvider>
  );
}
