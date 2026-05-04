import Link from 'next/link'

export const metadata = {
  title: 'OXAR Protocol — Documentation',
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
          OXAR Protocol Docs
        </h1>

        <div className="space-y-12 font-mono text-sm leading-relaxed text-white/30 [&_strong]:text-white [&_strong]:font-normal [&_h2]:text-white [&_h2]:font-sans [&_h2]:text-xl [&_h2]:font-normal [&_h2]:mb-4 [&_h2]:mt-0">
          <section>
            <h2>Overview</h2>
            <p>
              OXAR Protocol is a platform for <strong>tokenizing government-guaranteed bonds from emerging markets on Solana</strong>. Users deposit USDC and receive <strong>yield-bearing SPL tokens</strong> backed by sovereign debt. Starting with Ukraine, offering <strong>4-18% APY</strong>.
            </p>
          </section>

          <section>
            <h2>How It Works</h2>
            <p>
              Users sign up via <strong>email or wallet</strong> through Privy — no KYC required for small amounts. Once connected, users can <strong>deposit USDC into vaults</strong> representing different bond types and currencies.
            </p>
            <p className="mt-4">
              Upon deposit, users receive <strong>yield-bearing tokens (oxUAH, oxUSD)</strong> whose price increases daily as bond yield accrues on-chain. Users can sell on the built-in marketplace or wait for bond maturity.
            </p>
          </section>

          <section>
            <h2>Token Model</h2>
            <p>
              Yield tokens are <strong>SPL tokens on Solana</strong>. Each token represents a share of the underlying government bond vault. Token price increases daily based on the bond&apos;s accrued yield.
            </p>
            <p className="mt-4">
              The OXAR token family includes:
            </p>
            <ul className="list-none space-y-3 mt-4">
              <li>→ <strong>oxUAH</strong> — Ukrainian hryvnia-denominated bond yield tokens</li>
              <li>→ <strong>oxUSD</strong> — USD-denominated bond yield tokens</li>
            </ul>
          </section>

          <section>
            <h2>Features</h2>
            <ul className="list-none space-y-3 mt-4">
              <li>→ <strong>Deposit USDC</strong> — enter any vault with USDC stablecoin</li>
              <li>→ <strong>6 Vaults (MVP)</strong> — different bond types, currencies, and maturities</li>
              <li>→ <strong>Daily yield accrual</strong> — token price updates every day on-chain</li>
              <li>→ <strong>Built-in marketplace</strong> — sell your position to other users 24/7</li>
              <li>→ <strong>Proof of Reserve</strong> — on-chain verification of underlying bonds</li>
              <li>→ <strong>No lock-ups</strong> — exit anytime via marketplace or at maturity</li>
              <li>→ <strong>0% income tax</strong> — Ukrainian government bonds are tax-exempt</li>
            </ul>
          </section>

          <section>
            <h2>Trust & Security</h2>
            <p>
              <strong>Authentication:</strong> Powered by Privy, supporting email and wallet sign-in. Each user gets an embedded Solana wallet — no seed phrases, no browser extensions required.
            </p>
            <p className="mt-4">
              <strong>Bond Custody:</strong> Bonds are purchased via a licensed Ukrainian broker regulated by NSSMC (National Securities and Stock Market Commission).
            </p>
            <p className="mt-4">
              <strong>Smart Contracts:</strong> OXAR smart contracts are deployed on Solana and are open source. Proof of Reserve is verifiable on-chain.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
