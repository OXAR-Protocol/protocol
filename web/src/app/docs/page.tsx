import Link from 'next/link'

export const metadata = {
  title: 'OXAR — Documentation',
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-surface-0 text-white px-6 py-32">
      <div className="max-w-[800px] mx-auto">
        <Link href="/" className="font-mono text-sm text-white/30 hover:text-white transition-colors mb-12 inline-block">
          ← Back
        </Link>

        <span className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-white/30 block mb-4">
          [ DOCUMENTATION ]
        </span>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-sans font-normal mb-8">
          How OXAR works
        </h1>

        <div className="space-y-12 font-mono text-sm leading-relaxed text-white/30 [&_strong]:text-white [&_strong]:font-normal [&_h2]:text-white [&_h2]:font-sans [&_h2]:text-xl [&_h2]:font-normal [&_h2]:mb-4 [&_h2]:mt-0">
          <section>
            <h2>Overview</h2>
            <p>
              OXAR is a <strong>savings app with built-in yield</strong>. Connect a crypto wallet (Phantom, Backpack, MetaMask) or just tap Apple Pay. Your USDC routes into curated yield sources — Ondo Treasury tokens, Maple credit pools, Kamino USDC lending, Ethena sUSDe, Jupiter LP, and others. Withdraw anytime, never custodial.
            </p>
            <p className="mt-4">
              Optionally, start a <strong>friends pile</strong> with people you trust. Real shared goal — apartment, trip, ring — with on-chain progress tracking, automatic yield streaming, and pro-rata exit for anyone who needs out.
            </p>
          </section>

          <section>
            <h2>Onboarding</h2>
            <p>
              Two paths, your choice:
            </p>
            <ul className="list-none space-y-3 mt-4">
              <li>→ <strong>I have crypto</strong> — connect Phantom / Backpack / MetaMask. Your USDC stays in your wallet; we just route it.</li>
              <li>→ <strong>Just tap to deposit</strong> — Apple Pay or Google Pay via Ramp Network (licensed). USDC lands in a non-custodial wallet we generate via Privy. You hold the keys.</li>
            </ul>
            <p className="mt-4">
              Either way: setup &lt; 2 minutes, no KYC for everyday amounts, no bank account, no broker.
            </p>
          </section>

          <section>
            <h2>Risk templates</h2>
            <p>
              Three opinionated speeds. Pick one — change anytime.
            </p>
            <ul className="list-none space-y-3 mt-4">
              <li>→ <strong>😴 Sleepy (4-6% APY)</strong> — Ondo USDY (US Treasuries) + Kamino USDC. Lowest volatility.</li>
              <li>→ <strong>🚶 Walking (6-9% APY)</strong> — mix of Maple Syrup, Kamino, JLP. Balanced.</li>
              <li>→ <strong>🏃 Running (9-14% APY)</strong> — Ethena sUSDe, Jupiter LP, Drift insurance. Higher volatility, higher upside.</li>
            </ul>
            <p className="mt-4">
              We don't make personalized recommendations. APYs displayed are current rates from the underlying sources; they fluctuate with market conditions.
            </p>
          </section>

          <section>
            <h2>Friends pile (group vault)</h2>
            <p>
              <strong>What it is.</strong> A shared on-chain vault with multiple members and one goal. Each member contributes USDC; each holds a pro-rata share. Vault generates yield from the same sources as personal positions.
            </p>
            <p className="mt-4">
              <strong>How exit works.</strong> Any member can withdraw their share at any time without group approval. No "lock until goal hit" mechanic — you always own your part.
            </p>
            <p className="mt-4">
              <strong>Goal tracking.</strong> Real-time progress bar, contributor list, milestones, push notifications when someone deposits. Yield from personal positions can stream into the group goal automatically — accelerates accumulation without spending principal.
            </p>
            <p className="mt-4">
              <strong>Why this is not an investment club.</strong> Yield source is locked at vault creation. No pooled investment decision-making. No fund manager. Each member sees and controls their own share. This is shared savings, not collective investment.
            </p>
          </section>

          <section>
            <h2>Withdrawal</h2>
            <p>
              <strong>Liquid portion</strong> (default 20% kept as hot pool): instant. <strong>Cold capital</strong> (deployed in yield sources): T+1 to T+3 depending on source. UI shows you both.
            </p>
            <p className="mt-4">
              No locks, no penalties, no minimum hold periods. The performance fee (10% of earned yield) is taken at withdrawal — fully transparent on-chain.
            </p>
          </section>

          <section>
            <h2>Cross-chain (Delora)</h2>
            <p>
              Many of the best yield sources live on Ethereum (Ondo USDY, Ethena sUSDe, Sky sDAI). OXAR routes through <strong>Delora</strong>, a cross-chain bridge and swap aggregator. Your USDC on Solana → bridged → deposited into the source → tracked back on OXAR. One transaction from your perspective.
            </p>
          </section>

          <section>
            <h2>Trust & security</h2>
            <p>
              <strong>Auth:</strong> Privy for email + wallet sign-in. Each user gets an embedded Solana wallet they control — no seed phrases to manage unless you bring your own.
            </p>
            <p className="mt-4">
              <strong>Smart contracts:</strong> OXAR Protocol is open source on Solana, deployed at Program ID <code className="text-white/70">8RCVjQJh...nCBQwJ</code>. External audit pre-mainnet launch.
            </p>
            <p className="mt-4">
              <strong>Non-custodial:</strong> OXAR smart contracts cannot withdraw your funds. Group vault contracts cannot move your share without your signature.
            </p>
          </section>

          <section>
            <h2>Status</h2>
            <p>
              <strong>May 2026:</strong> Smart contracts deployed on Solana Devnet. Personal vault flow verified end-to-end. Group vaults and rules engine under construction.
            </p>
            <p className="mt-4">
              <strong>Aug 2026 (target):</strong> Public MVP launch.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
