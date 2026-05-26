import Link from 'next/link'

export const metadata = {
  title: 'OXAR — For Investors',
}

export default function InvestorsPage() {
  return (
    <main className="min-h-screen bg-surface-0 text-white px-6 py-32">
      <div className="max-w-[800px] mx-auto">
        <Link href="/" className="font-mono text-sm text-white/30 hover:text-white transition-colors mb-12 inline-block">
          ← Back
        </Link>

        <span className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-white/30 block mb-4">
          [ FOR INVESTORS ]
        </span>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-sans font-normal mb-8">
          OXAR
        </h1>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white/30 [&_strong]:text-white [&_strong]:font-normal [&_h2]:text-white [&_h2]:font-sans [&_h2]:text-lg [&_h2]:font-normal [&_h2]:mb-3 [&_h2]:mt-0">
          <p><strong>Where does your money sleep? Wake it up. Earn yield. Save together.</strong></p>

          <section>
            <h2>1. One-liner</h2>
            <p>
              OXAR is a <strong>savings app for the crypto-paid generation</strong>. Connect a wallet or tap Apple Pay, choose how loud you want your money, and save with friends on real goals. Yield from curated RWA and DeFi sources, withdraw anytime, never custodial.
            </p>
          </section>

          <section>
            <h2>2. The problem</h2>
            <p>
              Banks force a choice: <strong>high yield or instant access</strong>, never both. Crypto wallets sit at 0%. Savings apps cap at 4-5% and require a US bank account. Group saving infrastructure for shared goals (a flat, a trip, a wedding) literally does not exist with real yield attached.
            </p>
            <p className="mt-3">
              We break the tradeoff. <strong>5-12% APY</strong> across curated sources, <strong>instant withdraw</strong> from liquid positions, <strong>shared piles</strong> with friends — one product.
            </p>
          </section>

          <section>
            <h2>3. The product</h2>
            <p>
              <strong>Connect your wallet</strong> (Phantom, Backpack, MetaMask) <strong>or just tap to deposit</strong> via Apple Pay / Google Pay (Ramp Network). Pick a risk template: Sleepy (4-6%), Walking (6-9%), Running (9-14%).
            </p>
            <p className="mt-3">
              Your USDC routes into <strong>curated yield sources</strong>: Ondo USDY (US Treasuries), Maple Syrup (institutional credit), Ethena sUSDe, Jupiter LP, Kamino USDC. Cross-chain access via Delora — no bridges to manage.
            </p>
            <p className="mt-3">
              Optionally, start a <strong>friends pile</strong> with people you trust. Real goal, shared progress, each member holds their pro-rata share, anyone can withdraw their part anytime. Yield from personal positions can stream into the group goal automatically.
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
              <strong>SOM (Year 1):</strong> 500-5,000 active groups, $1-10M TVL across personal yield + group vaults.
            </p>
          </section>

          <section>
            <h2>6. Business model</h2>
            <p>
              <strong>10% performance fee</strong> on yield earned (we don't take from principal, only growth). At $10M TVL and 8% average APY → $80k annual revenue. At $100M TVL → $800k. Path to profitability around $26M TVL covering team + ops.
            </p>
            <p className="mt-3">
              <strong>Secondary streams:</strong> Delora fee share on cross-chain swaps (~10 bps), and in Phase 2+ optional premium features (advanced rules, multi-goal stacking).
            </p>
          </section>

          <section>
            <h2>7. Status & roadmap</h2>
            <p>
              <strong>Now (May 2026):</strong> Smart contracts live on Solana Devnet. Personal vault flow (initialize → deposit → withdraw → crank NAV) verified end-to-end. Program ID <code className="text-white/70">8RCVjQJh...nCBQwJ</code>. Group vault contracts under construction.
            </p>
            <p className="mt-3">
              <strong>Aug 2026:</strong> Public MVP launch. Personal yield + group piles + Apple Pay deposits. First friend groups onboard.
            </p>
            <p className="mt-3">
              <strong>Q4 2026:</strong> Additional rule types (buffer top-up, round-ups). Ukrainian bonds via licensed broker partner. Cross-chain yields fully wired.
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
            <p>
              Strategic interest, partnership, or grant intro? Reach out:
            </p>
            <p className="mt-3">
              <a href="mailto:support@oxar.app" className="text-accent hover:underline">support@oxar.app</a>
            </p>
            <p className="mt-3">
              Telegram: <a href="https://t.me/eternaki" className="text-accent hover:underline">@eternaki</a> (Daniel) · <a href="https://t.me/tarapatska" className="text-accent hover:underline">@tarapatska</a> (Anna)
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
