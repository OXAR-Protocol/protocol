import type { ExplainOutput, RiskScore, WalletAnalysis } from "@oxar/radar-core";

interface AnalyzeResultProps {
  analysis: WalletAnalysis;
  explanation: ExplainOutput;
}

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function AnalyzeResult({ analysis, explanation }: AnalyzeResultProps) {
  if (analysis.positions.length === 0) {
    return (
      <div className="mt-10 rounded-[5px] border border-white/10 bg-surface-1 p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          No RWA detected
        </div>
        <p className="mt-2 font-mono text-sm leading-relaxed text-white/60">
          No RWA positions found for this wallet across the protocols we currently
          index. We add new protocols every week.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total RWA exposure" value={USD.format(analysis.totalValueUsd)} accent />
        <Stat label="Weighted APY" value={`${(analysis.weightedApyBps / 100).toFixed(2)}%`} />
        <Stat label="Risk score" value={`${analysis.riskScore.overall} / 10`} />
      </div>

      <Section title="Positions">
        <div className="divide-y divide-white/10">
          {analysis.positions.map((position) => (
            <div key={position.protocolSlug} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm text-white">{position.protocolName}</div>
                <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                  {position.chain} · {position.balance.toFixed(2)} tokens
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-white">{USD.format(position.valueUsd)}</div>
                <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                  {(position.yieldApyBps / 100).toFixed(2)}% APY
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Risk breakdown">
        <RiskBreakdown score={analysis.riskScore} />
      </Section>

      <Section title="AI analysis">
        <div className="space-y-3 font-mono text-sm leading-relaxed text-white/80 [&_strong]:font-normal [&_strong]:text-white">
          <p>{explanation.summary}</p>
          <p className="text-white/50">
            <strong>Risks. </strong>
            {explanation.risks}
          </p>
          <p className="text-white/50">
            <strong>Considerations. </strong>
            {explanation.recommendations}
          </p>
        </div>
      </Section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-[5px] border bg-surface-1 p-4 ${
        accent
          ? "border-accent/30 shadow-[0_0_40px_rgba(139,92,246,0.06)]"
          : "border-white/10"
      }`}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl tabular-nums text-white">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[5px] border border-white/10 bg-surface-1 p-5">
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        {title}
      </div>
      {children}
    </div>
  );
}

function RiskBreakdown({ score }: { score: RiskScore }) {
  const rows: { label: string; level: RiskScore["counterpartyRisk"] }[] = [
    { label: "Counterparty", level: score.counterpartyRisk },
    { label: "Concentration", level: score.concentrationRisk },
    { label: "Smart contract", level: score.smartContractRisk },
    { label: "Liquidity", level: score.liquidityRisk },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {rows.map((row) => (
        <div key={row.label} className="rounded-[5px] border border-white/10 bg-surface-0 p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            {row.label}
          </div>
          <div className={`mt-1 font-mono text-sm uppercase ${riskColor(row.level)}`}>
            {row.level}
          </div>
        </div>
      ))}
    </div>
  );
}

function riskColor(level: RiskScore["counterpartyRisk"]): string {
  switch (level) {
    case "low":
      return "text-profit";
    case "medium":
      return "text-yellow-300";
    case "high":
      return "text-orange-300";
    case "critical":
      return "text-loss";
  }
}
