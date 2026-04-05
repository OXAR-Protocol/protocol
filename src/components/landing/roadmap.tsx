import { FadeIn } from "./fade-in";

const phases = [
  {
    phase: "Now \u00B7 Q2 2025",
    name: "Ukraine MVP",
    active: true,
    items: [
      "6 active vaults",
      "USDC deposits live",
      "Marketplace v1",
      "Proof of Reserve",
    ],
  },
  {
    phase: "Q3 2025",
    name: "Scale Up",
    active: false,
    items: [
      "Poland bonds",
      "Brazil expansion",
      "Seed round close",
      "Mobile app beta",
    ],
  },
  {
    phase: "Q4 2025",
    name: "Institutional",
    active: false,
    items: [
      "API for funds",
      "Institutional KYC",
      "5+ countries",
      "$10M TVL target",
    ],
  },
  {
    phase: "2026",
    name: "Global Protocol",
    active: false,
    items: [
      "20+ countries",
      "Secondary market",
      "Token launch",
      "DAO governance",
    ],
  },
];

export function Roadmap() {
  return (
    <section
      id="roadmap"
      className="px-6 md:px-10 py-20"
      style={{ borderBottom: "1px solid #2a2a2a" }}
    >
      <div className="font-mono text-[9px] tracking-[0.2em] text-oxar-light uppercase flex items-center gap-3 mb-4">
        06 &middot; Roadmap
        <span className="flex-1 h-px bg-oxar-gray" />
      </div>
      <FadeIn>
        <h2
          className="font-display leading-none text-oxar-white mb-[60px]"
          style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
        >
          Where we&apos;re going.
        </h2>
      </FadeIn>
      <FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0.5">
          {phases.map((p) => (
            <div
              key={p.name}
              className={`p-8 px-6 ${
                p.active
                  ? "bg-[rgba(200,255,0,0.03)]"
                  : "bg-oxar-dark"
              }`}
              style={{
                border: p.active
                  ? "1px solid rgba(200,255,0,0.4)"
                  : "1px solid #2a2a2a",
              }}
            >
              <div className="font-mono text-[9px] tracking-[0.15em] text-oxar-light uppercase mb-4 flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    p.active
                      ? "bg-oxar-accent shadow-[0_0_8px_#c8ff00]"
                      : "bg-oxar-mid"
                  }`}
                />
                {p.phase}
              </div>
              <div className="font-display text-[28px] leading-none text-oxar-white mb-4">
                {p.name}
              </div>
              <ul className="list-none flex flex-col gap-2">
                {p.items.map((item) => (
                  <li
                    key={item}
                    className="text-xs text-oxar-light font-light flex items-center gap-2"
                  >
                    <span className="text-[10px] text-oxar-mid">&mdash;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
