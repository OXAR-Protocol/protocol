import { DocPage } from "@/components/landing-v2/doc-page";

export const metadata = {
  title: "OXAR — Documentation",
};

export default function DocsPage() {
  return (
    <DocPage label="documentation" title="how oxar works">
      <section>
        <h2>Overview</h2>
        <p>
          OXAR is a <strong>non-custodial app where your money earns and grows</strong>. Connect a crypto wallet (Phantom, Backpack, MetaMask). Your USDC routes into curated yield sources — Jupiter Lend, Ondo Treasuries and Maple credit live today, with more on the way. Beyond yield, buy tokenized stocks and gold to hold. Withdraw anytime, never custodial.
        </p>
      </section>

      <section>
        <h2>Onboarding</h2>
        <ul className="mt-4 list-none space-y-3">
          <li>→ <strong>I have crypto</strong> — connect Phantom / Backpack / MetaMask, or sign in with email and get an embedded Solana wallet. Your USDC stays in your wallet; we just route it.</li>
          <li>→ <strong>Tap to deposit (coming)</strong> — Apple Pay or Google Pay via Ramp Network (licensed). USDC lands in your non-custodial wallet — you hold the keys.</li>
        </ul>
        <p className="mt-4">Either way: setup under 2 minutes, no bank account, no broker.</p>
      </section>

      <section>
        <h2>Risk templates</h2>
        <p>Three opinionated speeds. Pick one — change anytime.</p>
        <ul className="mt-4 list-none space-y-3">
          <li>→ <strong>😴 Sleepy (4-6% APY)</strong> — Ondo USDY (US Treasuries) + Jupiter Lend USDC. Lowest volatility.</li>
          <li>→ <strong>🚶 Walking (6-9% APY)</strong> — a mix of Maple Syrup and JLP. Balanced.</li>
          <li>→ <strong>🏃 Running (9-14% APY)</strong> — Jupiter LP, Drift insurance. Higher volatility, higher upside.</li>
        </ul>
        <p className="mt-4">
          We don&apos;t make personalized recommendations. APYs shown are current rates from the underlying sources; they move with the market.
        </p>
      </section>

      <section>
        <h2>Tokenized assets</h2>
        <p>
          <strong>Not just yield.</strong> Buy tokenized stocks (Backed xStocks — Apple, NVIDIA, the S&amp;P 500 and more) and gold (Tether Gold), held in your own wallet. Real price exposure with on-chain P&amp;L; buy or sell any time.
        </p>
        <p className="mt-4">
          Every asset has its <strong>own page</strong> explaining what it is and what it does, alongside the live price and chart — so you know what you&apos;re putting money into. <strong>Tokenized bonds</strong> and new asset classes are next.
        </p>
      </section>

      <section>
        <h2>Withdrawal</h2>
        <p>
          No locks, no penalties, no minimum hold. Withdraw from your on-chain position any time — yield sources settle from instant to a few days depending on the source; the UI shows you.
        </p>
        <p className="mt-4">
          A <strong>10% performance fee</strong> on yield earned (never on principal) is planned — taken at withdrawal and fully transparent on-chain.
        </p>
      </section>

      <section>
        <h2>Cross-chain (Delora)</h2>
        <p>
          Some of the best yield sources live on Ethereum (Ondo USDY, Sky sDAI). OXAR routes through <strong>Delora</strong>, a cross-chain bridge and swap aggregator: your USDC on Solana → bridged → deposited into the source → tracked back in OXAR. One transaction from your side.
        </p>
      </section>

      <section>
        <h2>Trust &amp; security</h2>
        <p>
          <strong>Auth:</strong> Privy for email + wallet sign-in. Each user gets an embedded Solana wallet they control — no seed phrases to manage unless you bring your own.
        </p>
        <p className="mt-4">
          <strong>No contract of our own:</strong> OXAR is a non-custodial <strong>interface</strong> over audited third-party protocols (Jupiter Lend, Ondo, Maple). There&apos;s no OXAR smart contract holding your funds — your money sits in your wallet and the protocols&apos; own audited contracts.
        </p>
        <p className="mt-4">
          <strong>Non-custodial:</strong> OXAR has no keys to move your funds. Every deposit, swap and withdrawal is signed by you.
        </p>
      </section>

      <section>
        <h2>Status</h2>
        <p>
          <strong>Now:</strong> Live on Solana <strong>mainnet</strong>. USDC yield (Jupiter Lend) plus tokenized stocks and gold work end-to-end — deposit → earn, or buy → hold → withdraw, all from your own wallet.
        </p>
        <p className="mt-4">
          <strong>Aug 2026 (target):</strong> Public launch — Apple Pay deposits, more sources, polished onboarding.
        </p>
        <p className="mt-4">
          <strong>Next:</strong> Tokenized bonds via a partner broker, more assets and chains, native iOS / Android apps.
        </p>
      </section>
    </DocPage>
  );
}
