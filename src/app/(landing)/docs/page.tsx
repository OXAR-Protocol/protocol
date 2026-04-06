import Link from 'next/link'

export const metadata = {
  title: 'OXAR Protocol -- Documentation',
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-surface-0 text-white px-6 py-32">
      <div className="max-w-[800px] mx-auto">
        <Link href="/" className="font-mono text-sm text-white/30 hover:text-white transition-colors mb-12 inline-block">
          &larr; Back
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
              OXAR is a protocol for <strong>tokenizing real-world assets on Solana</strong>. Starting with <strong>government bonds</strong>, the platform enables anyone to buy, sell, and hold tokenized RWA with full transparency and liquidity.
            </p>
          </section>

          <section>
            <h2>How It Works</h2>
            <p>
              Users sign up via <strong>email or Google</strong> through Privy -- no crypto wallet or seed phrase required. Once registered, users can <strong>deposit USDC into vaults</strong> that represent tokenized government bonds.
            </p>
            <p className="mt-4">
              Each vault holds a specific bond with defined maturity and yield. Users receive <strong>vault tokens</strong> representing their share of the underlying asset.
            </p>
          </section>

          <section>
            <h2>Token Model</h2>
            <p>
              Each vault issues its own <strong>SPL token on Solana</strong>. The token price tracks the underlying bond value, including accrued interest.
            </p>
            <ul className="list-none space-y-3 mt-4">
              <li>&rarr; <strong>Vault Tokens</strong> -- represent your share of the underlying bond</li>
              <li>&rarr; <strong>USDC</strong> -- deposit and withdrawal currency</li>
              <li>&rarr; <strong>Secondary Market</strong> -- trade vault tokens peer-to-peer</li>
            </ul>
          </section>

          <section>
            <h2>Features</h2>
            <ul className="list-none space-y-3 mt-4">
              <li>&rarr; <strong>Deposit USDC</strong> -- purchase vault tokens representing bonds</li>
              <li>&rarr; <strong>Claim at maturity</strong> -- redeem bonds for USDC + yield</li>
              <li>&rarr; <strong>Secondary marketplace</strong> -- sell vault tokens before maturity</li>
              <li>&rarr; <strong>Portfolio tracking</strong> -- monitor all your positions</li>
              <li>&rarr; <strong>Instant liquidity</strong> -- sell on the marketplace at any time</li>
            </ul>
          </section>

          <section>
            <h2>Security</h2>
            <p>
              <strong>Authentication:</strong> Powered by Privy, supporting email and Google sign-in. Each user gets an embedded Solana wallet -- no seed phrases required.
            </p>
            <p className="mt-4">
              <strong>Solana:</strong> All token operations run on Solana, providing sub-second finality and minimal transaction costs.
            </p>
            <p className="mt-4">
              <strong>Smart Contracts:</strong> The OXAR program is deployed on Solana using the Anchor framework. All logic is auditable on-chain.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
