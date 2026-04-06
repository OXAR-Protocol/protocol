import Link from 'next/link'

export const metadata = {
  title: 'OXAR Protocol — Terms of Use',
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
              By accessing or using the OXAR Protocol platform ("Platform"), website, or any associated services, you agree to be bound by these Terms of Use. If you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              OXAR Protocol provides a platform for <strong>depositing USDC and earning yield</strong> from government-guaranteed bonds in emerging markets. The Platform facilitates tokenization of sovereign debt instruments and provides access to real-world asset (RWA) bond yields on-chain via Solana.
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
              OXAR Protocol is a <strong>non-custodial platform</strong>. OXAR Protocol does not hold fiat funds on your behalf. Yield tokens (oxUAH, oxUSD) are held in your own non-custodial wallet. OXAR Protocol facilitates transactions but does not custody your assets at any point.
            </p>
          </section>

          <section>
            <h2>5. Risks</h2>
            <p>
              Tokenized bonds and blockchain-based platforms carry inherent risks. You acknowledge that: (a) <strong>sovereign credit risk</strong> exists with respect to the issuing government; (b) <strong>currency risk</strong> may affect returns when bonds are denominated in local currencies; (c) <strong>regulatory risks</strong> may affect the availability of the Platform or the legal status of tokenized assets in your jurisdiction; (d) <strong>blockchain network risks</strong>, including smart contract vulnerabilities, network congestion, and transaction failures, may impact your use of the Platform.
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
              In no event shall OXAR Protocol, its developers, contributors, or partners be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
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
              For questions regarding these terms, contact us via <a href="https://github.com/OXAR-Protocol" className="text-accent-blue hover:underline">GitHub</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
