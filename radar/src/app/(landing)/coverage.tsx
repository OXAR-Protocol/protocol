interface Protocol {
  slug: string;
  name: string;
  chain: "eth" | "sol";
  issuer: string;
  tvl: string;
}

const PROTOCOLS: readonly Protocol[] = [
  { slug: "buidl", name: "BlackRock BUIDL", chain: "eth", issuer: "BlackRock × Securitize", tvl: "$2.1B" },
  { slug: "ondo-usdy", name: "Ondo USDY", chain: "eth", issuer: "Ondo Finance", tvl: "$720M" },
  { slug: "ondo-ousg", name: "Ondo OUSG", chain: "eth", issuer: "Ondo Finance", tvl: "$251M" },
  { slug: "maple", name: "Maple Finance", chain: "eth", issuer: "Maple", tvl: "$10.6M" },
  { slug: "centrifuge", name: "Centrifuge", chain: "eth", issuer: "Centrifuge", tvl: "indexing" },
  { slug: "backed-bib01", name: "Backed bIB01", chain: "eth", issuer: "Backed Finance", tvl: "$245K" },
  { slug: "oxar", name: "OXAR Protocol", chain: "sol", issuer: "OXAR", tvl: "devnet" },
];

const CHAINS: readonly { code: string; label: string; live: boolean }[] = [
  { code: "ETH", label: "Ethereum mainnet", live: true },
  { code: "SOL", label: "Solana mainnet", live: true },
  { code: "BASE", label: "Base", live: false },
  { code: "ARB", label: "Arbitrum", live: false },
];

export function Coverage() {
  return (
    <section className="px-6 py-20 lg:px-12 lg:py-28">
      <div className="flex items-baseline gap-4 border-t border-[var(--color-line)] pt-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-dim)]">
          04 /
        </span>
        <span className="eyebrow">Coverage</span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] tracking-tight">
            Every major issuer, indexed every five minutes.
          </h2>
          <p className="mt-5 max-w-md text-[var(--color-text-muted)]">
            We pull <code className="font-mono text-[var(--color-accent)]">totalSupply</code>{" "}
            on-chain and combine it with verified NAV feeds. No second-hand dashboards. No
            stale daily snapshots.
          </p>

          <div className="mt-10 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">
              Chains
            </div>
            <div className="flex flex-wrap gap-2">
              {CHAINS.map((c) => (
                <span
                  key={c.code}
                  className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest ${
                    c.live
                      ? "border-[var(--color-accent-edge)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : "border-[var(--color-line)] text-[var(--color-text-dim)]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      c.live ? "bg-[var(--color-accent)]" : "bg-[var(--color-text-dim)]"
                    }`}
                  />
                  {c.code}
                  {!c.live && <span className="opacity-60">· soon</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-1)]">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[var(--color-line)] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">
            <span>Protocol</span>
            <span>Chain</span>
            <span>TVL</span>
          </div>
          {PROTOCOLS.map((p, i) => (
            <div
              key={p.slug}
              className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 ${
                i !== PROTOCOLS.length - 1 ? "border-b border-[var(--color-line)]" : ""
              }`}
            >
              <div>
                <div className="text-sm">{p.name}</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                  {p.issuer}
                </div>
              </div>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                  p.chain === "eth"
                    ? "bg-[rgba(244,245,243,0.06)] text-[var(--color-text-muted)]"
                    : "bg-[rgba(65,212,255,0.12)] text-[var(--color-cyan)]"
                }`}
              >
                {p.chain}
              </span>
              <span className="font-mono text-sm">{p.tvl}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
