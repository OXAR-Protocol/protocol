import { ScrollReveal } from "./scroll-reveal";

const steps = [
  {
    num: "01",
    title: "Deposit\nUSDC",
    desc: "Connect wallet or email. No KYC for small amounts.",
    arrow: true,
  },
  {
    num: "02",
    title: "Choose\nVault",
    desc: "Pick country, currency, bond type and duration.",
    arrow: true,
  },
  {
    num: "03",
    title: "Get\nToken",
    desc: "Receive oxUAH, oxUSD or oxEUR \u2014 yield-bearing SPL token.",
    arrow: true,
  },
  {
    num: "04",
    title: "Grows\nDaily",
    desc: "Token price increases every day as yield accrues on-chain.",
    arrow: true,
  },
  {
    num: "05",
    title: "Exit\nAnytime",
    desc: "Sell on built-in marketplace or wait for bond maturity.",
    arrow: false,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="px-6 md:px-10 py-20"
      style={{ borderBottom: "1px solid #2a2a2a" }}
    >
      <div className="font-mono text-[9px] tracking-[0.2em] text-oxar-light uppercase flex items-center gap-3 mb-4">
        02 &middot; How it works
        <span className="flex-1 h-px bg-oxar-gray" />
      </div>
      <ScrollReveal>
        <h2
          className="font-display leading-none text-oxar-white mb-[60px] max-w-[600px]"
          style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
        >
          Five steps.
          <br />
          One yield-bearing token.
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`p-8 px-6 border border-oxar-gray bg-oxar-dark relative transition-colors duration-200 hover:bg-oxar-dark2 ${
                i < steps.length - 1 ? "lg:border-r-0" : ""
              }`}
            >
              <div className="font-mono text-[9px] text-oxar-light tracking-[0.12em] mb-5">
                {step.num}
              </div>
              <div className="font-display text-[22px] text-oxar-white leading-[1.1] mb-2 whitespace-pre-line">
                {step.title}
              </div>
              <div className="text-[11px] text-oxar-light leading-[1.6] font-light">
                {step.desc}
              </div>
              {step.arrow && (
                <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-px bg-oxar-mid z-[2]" />
              )}
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
