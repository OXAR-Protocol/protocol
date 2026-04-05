import { FadeIn } from "./fade-in";

const trustItems = [
  { num: "01", text: "Bonds purchased through licensed Ukrainian broker" },
  { num: "02", text: "Smart contract audited by independent firm" },
  { num: "03", text: "Proof of Reserve published on-chain, updated daily" },
  { num: "04", text: "Open source contracts on GitHub" },
  { num: "05", text: "0% income tax on Ukrainian government bonds" },
];

const audienceCards = [
  {
    title: "Crypto Investors",
    desc: "Want higher yield than US Treasuries without leaving the on-chain ecosystem.",
    yield: "UP TO 18% APY \u00B7 UAH VAULTS",
  },
  {
    title: "Diaspora",
    desc: "Support Ukraine directly while earning competitive yield on USD or UAH.",
    yield: "WAR BONDS \u00B7 IMPACT NARRATIVE",
  },
  {
    title: "Institutions",
    desc: "Emerging market bond exposure on-chain with programmable yield and full transparency.",
    yield: "API ACCESS \u00B7 COMING Q3 2025",
  },
];

export function TrustAndAudience() {
  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-2"
      style={{ borderBottom: "1px solid #2a2a2a" }}
    >
      {/* Trust Left */}
      <FadeIn>
        <div
          className="p-10 md:p-20"
          style={{ borderRight: "1px solid #2a2a2a" }}
        >
          <div className="font-mono text-[9px] tracking-[0.2em] text-oxar-light uppercase flex items-center gap-3 mb-4">
            04 &middot; Trust
            <span className="flex-1 h-px bg-oxar-gray" />
          </div>
          <h2
            className="font-display leading-none text-oxar-white mb-8"
            style={{ fontSize: "clamp(36px, 4vw, 56px)" }}
          >
            Real bonds.
            <br />
            On-chain proof.
          </h2>
          <div className="flex flex-col">
            {trustItems.map((item, i) => (
              <div
                key={item.num}
                className={`flex items-center gap-4 py-5 ${
                  i < trustItems.length - 1
                    ? "border-b border-oxar-gray"
                    : ""
                }`}
              >
                <span className="font-mono text-[9px] text-oxar-mid tracking-[0.1em] min-w-[24px]">
                  {item.num}
                </span>
                <span className="text-sm text-oxar-lighter font-light leading-[1.5] flex-1">
                  {item.text}
                </span>
                <div className="w-5 h-5 border border-oxar-gray flex items-center justify-center flex-shrink-0 text-[10px] text-oxar-accent">
                  &#10003;
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Audience Right */}
      <FadeIn>
        <div className="p-10 md:p-20">
          <div className="font-mono text-[9px] tracking-[0.2em] text-oxar-light uppercase flex items-center gap-3 mb-4">
            05 &middot; For whom
            <span className="flex-1 h-px bg-oxar-gray" />
          </div>
          <div className="flex flex-col gap-0.5">
            {audienceCards.map((card) => (
              <div
                key={card.title}
                className="p-6 border border-oxar-gray bg-oxar-dark transition-all duration-200 hover:border-oxar-mid hover:bg-oxar-dark2"
              >
                <div className="font-display text-[24px] text-oxar-white mb-1.5">
                  {card.title}
                </div>
                <div className="text-xs text-oxar-light font-light leading-[1.6]">
                  {card.desc}
                </div>
                <div className="font-mono text-[10px] text-oxar-accent tracking-[0.1em] mt-2.5">
                  {card.yield}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
