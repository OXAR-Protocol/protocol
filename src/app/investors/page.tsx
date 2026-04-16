import Link from 'next/link'

export const metadata = {
  title: 'OXAR Protocol — For Investors',
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
          OXAR Protocol
        </h1>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white/30 [&_strong]:text-white [&_strong]:font-normal [&_h2]:text-white [&_h2]:font-sans [&_h2]:text-lg [&_h2]:font-normal [&_h2]:mb-3 [&_h2]:mt-0">
          <p><strong>Real-world yields. On-chain access.</strong></p>

          <section>
            <h2>1. Overview</h2>
            <p>
              OXAR Protocol <strong>tokenizes emerging market government bonds on Solana</strong>, giving on-chain users access to 4–18% APY sovereign-backed yields through a single USDC deposit. No bank, no broker, no lock-ups.
            </p>
          </section>

          <section>
            <h2>2. Problem</h2>
            <p>
              Over <strong>$230B in stablecoins sit idle</strong> across DeFi and CEXs, earning zero yield. The best on-chain option today is tokenized US Treasuries at ~4% APY — a market that grew to <strong>$2B+ TVL in under a year</strong>, proving massive demand for real-world yield on-chain.
            </p>
            <p className="mt-3">
              But treasuries are a ceiling, not a floor. Emerging market sovereign bonds offer <strong>4–18% APY</strong> — up to 4.5x more — yet have zero on-chain access today. The infrastructure to bridge these yields doesn't exist. That's what OXAR builds.
            </p>
          </section>

          <section>
            <h2>3. Solution</h2>
            <p>
              OXAR wraps government bonds into <strong>yield-bearing SPL tokens</strong> (oxUAH, oxUSD, oxEUR) on Solana. Each token is backed by a real bond position held through a licensed local broker. Token price increases daily as bond yield accrues on-chain.
            </p>
            <p className="mt-3">
              The user experience is simple: <strong>deposit USDC → choose a vault → receive yield tokens → earn daily → exit anytime</strong> via the built-in marketplace or at bond maturity. Onboarding takes under 1 minute with email or wallet login.
            </p>
            <p className="mt-3">
              Each vault has an on-chain <strong>Proof of Reserve</strong> — the NAV and backing are verifiable at any time directly from the smart contract.
            </p>
          </section>

          <section>
            <h2>4. Market Size</h2>
            <p>
              <strong>TAM:</strong> $230B+ stablecoins seeking yield. Tokenized US Treasuries alone reached <strong>$3B+ TVL</strong> in under 18 months — proving massive demand for on-chain RWA.
            </p>
            <p className="mt-3">
              <strong>SAM:</strong> ~$5B in DeFi-native capital actively seeking higher yield alternatives beyond US Treasuries — yield aggregators, DAO treasuries, and power users looking for diversified sovereign exposure.
            </p>
            <p className="mt-3">
              <strong>SOM (Year 1):</strong> $1–5M TVL across Ukraine bond vaults. Ukraine's domestic government bond market is <strong>~$25B outstanding</strong>, with war bond issuance alone exceeding $5B since 2022.
            </p>
          </section>

          <section>
            <h2>5. Business Model</h2>
            <p>
              OXAR earns through a <strong>yield spread</strong>. The protocol retains a portion of the bond yield as a management fee — the difference between the gross bond rate and the net rate passed to token holders. No deposit fees, no withdrawal fees, no hidden costs.
            </p>
            <p className="mt-3">
              At scale, additional revenue comes from <strong>marketplace fees</strong> on secondary trading of vault tokens between users, and <strong>institutional API access</strong> for programmatic bond exposure.
            </p>
            <p className="mt-3">
              Unit economics improve with scale: custody and brokerage costs are largely fixed, while management fee revenue grows linearly with TVL.
            </p>
          </section>

          <section>
            <h2>6. Traction & Roadmap</h2>
            <p>
              <strong>Current status (Q2 2026):</strong> Live on Solana Devnet with 6 bond vaults (UAH, USD, EUR), USDC deposit flow, daily NAV accrual, secondary marketplace, and Proof of Reserve — all functional. Smart contracts audited internally, frontend deployed.
            </p>
            <p className="mt-3">
              <strong>Q3 2026:</strong> Mainnet launch with Ukraine vaults. Add Poland and other emerging market bonds. Seed round. Mobile app beta.
            </p>
            <p className="mt-3">
              <strong>Q4 2026:</strong> Institutional API for funds and DAOs. KYC module integration. Expand to 5+ countries.
            </p>
            <p className="mt-3">
              <strong>2027:</strong> 20+ countries, DAO governance, protocol token launch. Goal: become the <strong>standard infrastructure layer</strong> for emerging market sovereign yield on-chain.
            </p>
          </section>

          <section>
            <h2>7. Contact</h2>
            <p>
              Interested in learning more or discussing investment opportunities? Reach out to us directly:
            </p>
            <p className="mt-3">
              <a href="mailto:support@oxar.app" className="text-accent hover:underline">support@oxar.app</a> — email
            </p>
            <p className="mt-3">
              <a href="https://t.me/eternaki" className="text-accent hover:underline">@eternaki</a> · <a href="https://t.me/tarapatska" className="text-accent hover:underline">@tarapatska</a> — Telegram
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
