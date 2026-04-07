"use client";

import { SectionLabel } from "@/components/section-label";
import { OpportunityCost } from "@/components/explore/opportunity-cost";
import { BondSwap } from "@/components/explore/bond-swap";

export default function VaultsPage() {
  return (
    <div className="py-8 space-y-8">
      <SectionLabel>Explore</SectionLabel>
      <OpportunityCost />
      <BondSwap />
    </div>
  );
}
