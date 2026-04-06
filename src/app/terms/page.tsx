import Link from 'next/link'

export const metadata = {
  title: 'ETNY — Terms of Use',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface-0 text-white px-6 py-32">
      <div className="max-w-[800px] mx-auto">
        <Link href="/" className="font-mono text-sm text-white/30 hover:text-white transition-colors mb-12 inline-block">
          ← Back
        </Link>

        <span className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-white/30 block mb-4">
          [ LEGAL ]
        </span>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-sans font-normal mb-8">
          Terms of Use
        </h1>

        <div className="space-y-8 font-mono text-sm leading-relaxed text-white/30 [&_strong]:text-white [&_strong]:font-normal [&_h2]:text-white [&_h2]:font-sans [&_h2]:text-lg [&_h2]:font-normal [&_h2]:mb-3 [&_h2]:mt-0">
          <p><strong>Last updated:</strong> March 28, 2026</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the ETNY platform ("Platform"), website, or any associated services, you agree to be bound by these Terms of Use. If you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              ETNY provides a platform for <strong>buying, selling, and sending tokenized gold</strong> (ETNYG tokens). Each ETNYG token represents 1 gram of physical gold. The Platform facilitates transactions between participants and provides access to real-world asset (RWA) gold markets on-chain.
            </p>
          </section>

          <section>
            <h2>3. Eligibility</h2>
            <p>
              You must be at least 18 years old and legally capable of entering into binding agreements in your jurisdiction. The Platform is not available in jurisdictions where its use would be prohibited by law.
            </p>
          </section>

          <section>
            <h2>4. No Custody</h2>
            <p>
              ETNY is a <strong>non-custodial platform</strong>. ETNY does not hold fiat funds on your behalf. ETNYG tokens are held in your own non-custodial wallet. ETNY facilitates transactions but does not custody your assets at any point.
            </p>
          </section>

          <section>
            <h2>5. Risks</h2>
            <p>
              Tokenized gold and blockchain-based platforms carry inherent risks. You acknowledge that: (a) <strong>volatility of gold prices</strong> may result in loss of value; (b) <strong>counterparty risk</strong> exists with respect to the custodian holding the underlying physical gold; (c) <strong>regulatory risks</strong> may affect the availability of the Platform or the legal status of tokenized assets in your jurisdiction; (d) <strong>blockchain network risks</strong>, including smart contract vulnerabilities, network congestion, and transaction failures, may impact your use of the Platform.
            </p>
          </section>

          <section>
            <h2>6. No Warranty</h2>
            <p>
              The Platform is provided <strong>"as is"</strong> without warranties of any kind, express or implied. We do not guarantee uptime, security, or fitness for any particular purpose.
            </p>
          </section>

          <section>
            <h2>7. Limitation of Liability</h2>
            <p>
              In no event shall ETNY, its developers, contributors, or partners be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
            </p>
          </section>

          <section>
            <h2>8. Privacy</h2>
            <p>
              The Platform is designed with <strong>privacy in mind</strong>. We minimize the collection of personal data. On-chain transactions are publicly visible on the blockchain, but we do not collect or store additional personal information beyond what is necessary to facilitate the service.
            </p>
          </section>

          <section>
            <h2>9. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes take effect upon posting to the website. Continued use of the Platform constitutes acceptance of modified terms.
            </p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>
              For questions regarding these terms, contact us at <a href="mailto:contact@etny.app" className="text-accent-blue hover:underline">contact@etny.app</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
