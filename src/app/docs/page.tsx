import Link from 'next/link'

export const metadata = {
  title: 'ETNY Gold — Documentation',
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
          ETNY Gold Platform Docs
        </h1>

        <div className="space-y-12 font-mono text-sm leading-relaxed text-white/30 [&_strong]:text-white [&_strong]:font-normal [&_h2]:text-white [&_h2]:font-sans [&_h2]:text-xl [&_h2]:font-normal [&_h2]:mb-4 [&_h2]:mt-0">
          <section>
            <h2>Overview</h2>
            <p>
              ETNY is a platform for <strong>buying, selling, and sending real gold digitally</strong>. Each <strong>ETNYG token represents 1 gram of physical gold</strong>, fully backed and audited. The platform is built on <strong>Arbitrum L2</strong>, providing fast and low-cost transactions while inheriting Ethereum's security.
            </p>
          </section>

          <section>
            <h2>How It Works</h2>
            <p>
              Users sign up via <strong>email or Google</strong> through Privy — no crypto wallet or seed phrase required. Once registered, users can <strong>buy ETNYG tokens with a bank card</strong>. Under the hood, the platform purchases <strong>PAXG (a gold-backed stablecoin)</strong> and wraps it into ETNYG.
            </p>
            <p className="mt-4">
              <strong>1 ETNYG = 1 gram of gold.</strong> Users can sell their tokens back to fiat instantly or send gold to other users on the platform — all without needing to understand blockchain mechanics.
            </p>
          </section>

          <section>
            <h2>Token Model</h2>
            <p>
              <strong>ETNYG</strong> is an <strong>ERC-20 token on Arbitrum</strong>. In the future, when a user accumulates 1 gram or more, they will be able to convert their tokens into an <strong>NFT tied to a specific gold bar</strong> — with serial number, refinery, and vault location recorded on-chain.
            </p>
            <p className="mt-4">
              The ETNY token family includes:
            </p>
            <ul className="list-none space-y-3 mt-4">
              <li>→ <strong>$ETNYG</strong> — Gold (1 token = 1 gram of gold)</li>
              <li>→ <strong>$ETNYS</strong> — Silver (1 token = 1 gram of silver)</li>
              <li>→ <strong>$ETNYP</strong> — Platinum (1 token = 1 gram of platinum)</li>
            </ul>
          </section>

          <section>
            <h2>Features</h2>
            <ul className="list-none space-y-3 mt-4">
              <li>→ <strong>Buy / Sell with fiat</strong> — purchase and liquidate gold using your bank card</li>
              <li>→ <strong>Send gold to users</strong> — transfer gold to any platform user instantly</li>
              <li>→ <strong>Swap between assets</strong> — exchange gold, silver, and platinum tokens</li>
              <li>→ <strong>Auto-buy (DCA)</strong> — set up recurring purchases to dollar-cost average into gold</li>
              <li>→ <strong>Price alerts</strong> — get notified when gold hits your target price</li>
              <li>→ <strong>Gift cards</strong> — send gold as a gift to anyone</li>
              <li>→ <strong>Instant liquidity</strong> — sell your gold back to fiat at any time</li>
              <li>→ <strong>Audit notifications</strong> — receive updates when reserves are audited</li>
            </ul>
          </section>

          <section>
            <h2>Business Model</h2>
            <ul className="list-none space-y-3 mt-4">
              <li>→ <strong>Trading commission</strong> — 0.5-1% per buy/sell transaction</li>
              <li>→ <strong>Spread</strong> — small markup between buy and sell prices</li>
              <li>→ <strong>Storage fee</strong> — annual fee for physical gold custody</li>
              <li>→ <strong>Allocation fee</strong> — one-time fee when converting tokens to a bar-backed NFT</li>
              <li>→ <strong>Annual audit fee</strong> — covers third-party reserve verification</li>
            </ul>
          </section>

          <section>
            <h2>Security</h2>
            <p>
              <strong>Authentication:</strong> Powered by Privy, supporting email and Google sign-in. Each user gets an embedded wallet — no seed phrases, no browser extensions required.
            </p>
            <p className="mt-4">
              <strong>Arbitrum L2:</strong> All token operations run on Arbitrum, providing low gas costs and fast finality while inheriting Ethereum mainnet security.
            </p>
            <p className="mt-4">
              <strong>Smart Contracts:</strong> ETNYG token contracts are deployed on Arbitrum and govern minting, burning, and transfers. All contract logic is auditable on-chain.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
