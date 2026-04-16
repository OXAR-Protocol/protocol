"use client";

import type { VaultConfig } from "@oxar/sdk";

import { getBondColor } from "@/lib/bond-constants";
import {
  getBondName,
  getBondTerm,
  getBondIssuer,
  getRegionLabel,
} from "@/lib/bond-labels";
import { getBondCity } from "@/lib/bond-cities";
import { GrowthChart } from "./growth-chart";
import { DetailRow } from "./detail-row";

interface BondDetailsProps {
  config: VaultConfig;
  amount: number;
  apyPercent: number;
  tvl: string | null;
}

export function BondDetails({ config, amount, apyPercent, tvl }: BondDetailsProps) {
  const { color } = getBondColor(config.denomination);
  const city = getBondCity(config.id);

  return (
    <div className="rounded-[5px] border border-white/10 bg-surface-0 p-6 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            Projected Growth
          </label>
          <span className="font-mono text-[10px] text-white/20">12 months</span>
        </div>
        <div className="flex-1">
          <GrowthChart
            amount={amount}
            apy={apyPercent}
            denomination={config.denomination}
            color={color}
          />
        </div>
      </div>

      <div className="flex flex-col lg:border-l lg:border-white/10 lg:pl-8">
        <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-4">
          Bond Details
        </label>
        <dl className="font-mono text-xs">
          <DetailRow label="Type" value={getBondName(config)} />
          <DetailRow label="Issuer" value={getBondIssuer(config)} />
          <DetailRow label="Region" value={getRegionLabel(config.region)} />
          {city && <DetailRow label="Origin" value={city.name} />}
          <DetailRow label="Currency" value={config.denomination} />
          <DetailRow label="Term" value={getBondTerm(config)} />
          <DetailRow label="APY" value={`${apyPercent.toFixed(1)}%`} accent={color} />
          {tvl && <DetailRow label="TVL" value={tvl} />}
          <DetailRow label="FX Risk" value={config.hasFxRisk ? "Yes" : "No"} />
          <DetailRow label="Backing" value="Licensed broker" />
        </dl>
      </div>
    </div>
  );
}
