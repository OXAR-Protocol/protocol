"use client";

const items = [
  { text: "\u041E\u0412\u0414\u041F UAH \u00B7 18% APY", hi: true },
  { text: "War Bonds USD \u00B7 15% APY", hi: false },
  { text: "0% Tax \u00B7 Solana", hi: true },
  { text: "Proof of Reserve \u00B7 On-Chain", hi: false },
  { text: "\u041E\u0412\u0414\u041F USD \u00B7 4% APY", hi: true },
  { text: "\u041E\u0412\u0414\u041F EUR \u00B7 3.5% APY", hi: false },
  { text: "Smart Contract Audited", hi: true },
  { text: "6 Active Vaults", hi: false },
];

export function Ticker() {
  const allItems = [...items, ...items];

  return (
    <div
      className="overflow-hidden py-3"
      style={{ borderBottom: "1px solid #2a2a2a" }}
    >
      <div className="flex animate-ticker whitespace-nowrap">
        {allItems.map((item, i) => (
          <span
            key={i}
            className={`font-mono text-[9px] tracking-[0.12em] uppercase px-6 whitespace-nowrap ${
              item.hi ? "text-oxar-accent" : "text-oxar-mid"
            }`}
            style={{ borderRight: "1px solid #2a2a2a" }}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
