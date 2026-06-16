import { DocPage } from "@/components/landing-v2/doc-page";

export const metadata = {
  title: "OXAR — For Investors",
};

export default function InvestorsPage() {
  return (
    <DocPage label="for investors" title="oxar">
      <p><strong>Where does your money sleep? Wake it up. Earn yield. Own real assets.</strong></p>

      <section>
        <h2>1. One-liner</h2>
        <p>
          OXAR is a <strong>savings-and-investing app for the crypto-paid generation</strong>. Connect a wallet (Apple Pay deposits on the way), choose how loud you want your money, and earn yield from curated sources — or buy tokenized stocks and gold to hold. Withdraw anytime, never custodial.
        </p>
      </section>

      <section>
        <h2>2. The problem</h2>
        <p>
          Banks force a choice: <strong>high yield or instant access</strong>, never both. Crypto wallets sit at 0%. Savings apps cap at 4-5% and require a US bank account.
        </p>
        <p className="mt-3">
          And the moment you want more than a savings rate — stocks, gold, bonds — you're back in the legacy system: a broker, more KYC, market hours, waiting. We break the tradeoff: <strong>5-12% APY</strong> across curated yield sources, <strong>instant withdraw</strong> from liquid positions, and <strong>tokenized real-world assets</strong> — one non-custodial app.
        </p>
      </section>

      <section>
        <h2>3. The product</h2>
        <p>
          <strong>Connect your wallet</strong> (Phantom, Backpack, MetaMask). Apple Pay / Google Pay deposits via Ramp Network are on the way. Pick a risk template: Sleepy (4-6%), Walking (6-9%), Running (9-14%).
        </p>
        <p className="mt-3">
          Your USDC routes into <strong>curated yield sources</strong>: Jupiter Lend and Kamino USDC live today, with Ondo USDY (US Treasuries), Maple (institutional credit) and Ethena sUSDe on the way. Cross-chain access via Delora — no bridges to manage.
        </p>
        <p className="mt-3">
          Beyond yield, buy <strong>tokenized stocks and gold</strong> (Backed xStocks, Tether Gold) and hold them in your own wallet — real price exposure with on-chain P&amp;L. Each asset has its own page explaining what it is. <strong>Tokenized bonds</strong> and new asset classes are next.
        </p>
      </section>

      <section>
        <h2>4. Why now</h2>
        <p>
          Crypto-paid workforce is real and growing: Bitwage (150k+ workers), Toku (100+ countries), Deel crypto payroll, Superfluid streaming. <strong>Tokenized RWA is maturing</strong>: Ondo USDY ($500M+), Ethena sUSDe ($5B+), Maple ($1B+). Apple Pay → crypto via licensed providers like Ramp Network just became frictionless.
        </p>
        <p className="mt-3">
          Banks (Apple, Wealthfront, Marcus) cap at 4-5% because of US Treasury rates. Crypto-native users want more without taking obscure risks. <strong>This window opens for the next 12-24 months</strong> before Revolut / Coinbase close it.
        </p>
      </section>

      <section>
        <h2>5. Market</h2>
        <p>
          <strong>TAM:</strong> Anyone with a crypto wallet + savings instinct (~50M globally and growing).
        </p>
        <p className="mt-3">
          <strong>SAM:</strong> Crypto-paid earners + DAO contributors + remote workers using stablecoins for salary (~5M globally).
        </p>
        <p className="mt-3">
          <strong>SOM (Year 1):</strong> 500-5,000 active users, $1-10M TVL across yield positions and tokenized assets.
        </p>
      </section>

      <section>
        <h2>6. Business model</h2>
        <p>
          <strong>10% performance fee</strong> on yield earned (we don't take from principal, only growth). At $10M TVL and 8% average APY → $80k annual revenue. At $100M TVL → $800k. Path to profitability around $26M TVL covering team + ops.
        </p>
        <p className="mt-3">
          <strong>Secondary streams:</strong> a small spread on tokenized-asset swaps and a Delora fee share on cross-chain deposits (~10 bps), plus optional premium features in later phases.
        </p>
      </section>

      <section>
        <h2>7. Status & roadmap</h2>
        <p>
          <strong>Now:</strong> Live on Solana <strong>mainnet</strong> — a non-custodial UI over audited protocol SDKs (Jupiter Lend, Kamino), with no contract of our own to deploy or audit. USDC yield plus tokenized stocks and gold work end-to-end: deposit → earn, or buy → hold → withdraw, all from your own wallet.
        </p>
        <p className="mt-3">
          <strong>Aug 2026:</strong> Public launch. Yield + tokenized stocks and gold, Apple Pay deposits, polished onboarding.
        </p>
        <p className="mt-3">
          <strong>Q4 2026:</strong> First tokenized bonds via a licensed broker partner. More yield sources and assets; cross-chain deposits fully wired via Delora.
        </p>
        <p className="mt-3">
          <strong>2027:</strong> iOS / Android native apps. Multi-currency stablecoins. Geographic expansion via local partners.
        </p>
      </section>

      <section>
        <h2>8. Team</h2>
        <p>
          <strong>Daniel Lohachov</strong> (63%) — Product, tech, founder of the prior OXAR iteration. Solana ecosystem since 2023.
        </p>
        <p className="mt-3">
          <strong>Anna Tarapatska</strong> (37%) — Operations, legal, partnerships.
        </p>
      </section>

      <section>
        <h2>9. Funding</h2>
        <p>
          Not raising a traditional angel round. We're pursuing <strong>grants + accelerators + hackathon prizes</strong> to fund MVP launch (target $30k pre-launch). Crypto VC seed planned for post-PMF (12-18 months out).
        </p>
        <p className="mt-3">
          Targets in motion: Solana Foundation ecosystem grant ($25-50k), Colosseum hackathon, Мінцифри × Binance contest. Strategic partnerships with Delora (cross-chain), Ramp Network (fiat), Privy (auth) already in place.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>Strategic interest, partnership, or grant intro? Reach out:</p>
        <p className="mt-3"><a href="mailto:support@oxar.app">support@oxar.app</a></p>
        <p className="mt-3">
          Telegram: <a href="https://t.me/eternaki">@eternaki</a> (Daniel) · <a href="https://t.me/tarapatska">@tarapatska</a> (Anna)
        </p>
      </section>
    </DocPage>
  );
}
