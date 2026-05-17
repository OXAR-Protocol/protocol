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
      <div className="mt-10 rounded-lg border border-white/10 bg-[var(--color-surface-1)] p-6">
        <p className="text-[var(--color-text-muted)]">
          No RWA positions detected for this wallet across the protocols we
          currently index. We add new protocols every week.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total RWA exposure" value={USD.format(analysis.totalValueUsd)} />
        <Stat label="Weighted APY" value={`${(analysis.weightedApyBps / 100).toFixed(2)}%`} />
        <Stat label="Risk score" value={`${analysis.riskScore.overall} / 10`} />
      </div>

      <Section title="Positions">
        <div className="divide-y divide-white/5">
          {analysis.positions.map((position) => (
            <div key={position.protocolSlug} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium">{position.protocolName}</div>
                <div className="font-mono text-xs text-[var(--color-text-muted)]">
                  {position.chain} · {position.balance.toFixed(2)} tokens
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{USD.format(position.valueUsd)}</div>
                <div className="font-mono text-xs text-[var(--color-text-muted)]">
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
        <div className="space-y-3 text-sm leading-relaxed">
          <p>{explanation.summary}</p>
          <p className="text-[var(--color-text-muted)]">
            <span className="font-medium text-white">Risks. </span>
            {explanation.risks}
          </p>
          <p className="text-[var(--color-text-muted)]">
            <span className="font-medium text-white">Considerations. </span>
            {explanation.recommendations}
          </p>
        </div>
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[var(--color-surface-1)] p-4">
      <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[var(--color-surface-1)] p-5">
      <div className="mb-4 font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
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
        <div key={row.label} className="rounded-md border border-white/5 p-3">
          <div className="text-xs text-[var(--color-text-muted)]">{row.label}</div>
          <div className={`mt-1 text-sm font-medium ${riskColor(row.level)}`}>
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
      return "text-[var(--color-accent)]";
    case "medium":
      return "text-yellow-400";
    case "high":
      return "text-orange-400";
    case "critical":
      return "text-red-400";
  }
}
