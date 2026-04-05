import { FadeIn } from "./fade-in";
import { YieldCalculator } from "./yield-calculator";

const vaults = [
  {
    flag: "UA \u00B7 \u0413\u0420\u0418\u0412\u041D\u042F \u00B7 SHORT",
    apy: "18%",
    name: "\u041E\u0412\u0414\u041F \u0413\u0440\u0438\u0432\u043D\u044F Short-Term",
    curr: "UAH \u00B7 3\u20136 months",
    impact: false,
    accentApy: false,
  },
  {
    flag: "UA \u00B7 \u0413\u0420\u0418\u0412\u041D\u042F \u00B7 MID",
    apy: "16%",
    name: "\u041E\u0412\u0414\u041F \u0413\u0440\u0438\u0432\u043D\u044F Mid-Term",
    curr: "UAH \u00B7 6\u201312 months",
    impact: false,
    accentApy: false,
  },
  {
    flag: "UA \u00B7 DOLLAR",
    apy: "4%",
    name: "\u041E\u0412\u0414\u041F USD-Denominated",
    curr: "USD \u00B7 Stable",
    impact: false,
    accentApy: false,
  },
  {
    flag: "UA \u00B7 EURO",
    apy: "3.5%",
    name: "\u041E\u0412\u0414\u041F EUR-Denominated",
    curr: "EUR \u00B7 Stable",
    impact: false,
    accentApy: false,
  },
  {
    flag: "WAR BONDS \u00B7 UAH",
    apy: "18%",
    name: "Military Bonds UAH",
    curr: "UAH \u00B7 Diaspora",
    impact: true,
    accentApy: true,
    apyLabel: "APY + support Ukraine",
  },
  {
    flag: "WAR BONDS \u00B7 USD",
    apy: "15%",
    name: "Military Bonds USD",
    curr: "USD \u00B7 Global",
    impact: true,
    accentApy: true,
    apyLabel: "APY + support Ukraine",
  },
];

export function VaultShowcase() {
  return (
    <section
      id="vaults"
      className="px-6 md:px-10 py-20"
      style={{ borderBottom: "1px solid #2a2a2a" }}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="font-mono text-[9px] tracking-[0.2em] text-oxar-light uppercase flex items-center gap-3 mb-4">
            03 &middot; Vaults
            <span className="flex-1 h-px bg-oxar-gray" />
          </div>
          <FadeIn>
            <h2
              className="font-display leading-none text-oxar-white"
              style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
            >
              6 Vaults.
              <br />
              One protocol.
            </h2>
          </FadeIn>
        </div>
        <div className="font-mono text-[10px] text-oxar-light tracking-[0.1em] uppercase">
          Ukraine MVP &middot; More countries coming
        </div>
      </div>
      <FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
          {vaults.map((v, i) => (
            <VaultCard key={i} {...v} />
          ))}
        </div>
      </FadeIn>
      <FadeIn>
        <YieldCalculator />
      </FadeIn>
    </section>
  );
}

function VaultCard({
  flag,
  apy,
  name,
  curr,
  impact,
  accentApy,
  apyLabel,
}: {
  flag: string;
  apy: string;
  name: string;
  curr: string;
  impact: boolean;
  accentApy: boolean;
  apyLabel?: string;
}) {
  return (
    <div
      className={`bg-oxar-dark p-8 px-7 relative overflow-hidden transition-all duration-[250ms] cursor-pointer hover:-translate-y-0.5 ${
        impact
          ? "hover:bg-[rgba(200,255,0,0.03)]"
          : "hover:bg-oxar-dark2 hover:border-oxar-mid"
      }`}
      style={{
        border: impact
          ? "1px solid rgba(200,255,0,0.2)"
          : "1px solid #2a2a2a",
      }}
    >
      {impact && (
        <div className="absolute top-5 right-5 font-mono text-[8px] tracking-[0.12em] uppercase text-oxar-accent py-1 px-2 border border-[rgba(200,255,0,0.4)]">
          IMPACT
        </div>
      )}
      <div className="font-mono text-[9px] tracking-[0.15em] text-oxar-light uppercase mb-5 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-oxar-accent shadow-[0_0_6px_#c8ff00]" />
        {flag}
      </div>
      <div
        className={`font-display text-[64px] leading-[0.9] mb-1 ${
          accentApy ? "text-oxar-accent" : "text-oxar-white"
        }`}
      >
        {apy}
      </div>
      <div className="font-mono text-[9px] text-oxar-light tracking-[0.15em] uppercase mb-5">
        {apyLabel || "APY estimated"}
      </div>
      <div className="text-sm text-oxar-lighter font-light mb-2">{name}</div>
      <div className="font-mono text-[10px] text-oxar-light tracking-[0.1em] py-1 px-2.5 border border-oxar-gray inline-block">
        {curr}
      </div>
      <div className="absolute bottom-4 right-4 w-5 h-5 border-r border-b border-oxar-gray" />
    </div>
  );
}
