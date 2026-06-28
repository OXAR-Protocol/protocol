import { DocPage } from "@/components/landing-v2/doc-page";

export const metadata = {
  title: "OXAR — Terms of Use",
};

export default function TermsPage() {
  return (
    <DocPage label="legal" title="terms of use">
      <p><strong>Last updated:</strong> May 25, 2026</p>

      <section>
        <h2>1. Acceptance</h2>
        <p>
          By accessing or using the OXAR platform ("Platform"), website oxar.app, app.oxar.app, or any associated services, you agree to be bound by these Terms. If you do not agree, do not use the Platform.
        </p>
      </section>

      <section>
        <h2>2. What OXAR is</h2>
        <p>
          OXAR is a <strong>non-custodial software interface</strong> that routes user-owned USDC into curated third-party yield sources (Ondo, Maple, Kamino, Jupiter LP, Sky, and others) and provides infrastructure for shared savings vaults among groups of users.
        </p>
        <p className="mt-3">
          We <strong>are not</strong> a bank, broker, custodian, money transmitter, investment advisor, or securities issuer. We do not hold your funds. We do not make investment decisions on your behalf.
        </p>
      </section>

      <section>
        <h2>3. Eligibility</h2>
        <p>
          You must be at least 18 years old and legally capable of entering into binding agreements in your jurisdiction. The Platform is not available where its use would violate applicable law. Certain jurisdictions may be geo-blocked at our discretion.
        </p>
      </section>

      <section>
        <h2>4. Non-custodial design</h2>
        <p>
          OXAR is <strong>fully non-custodial</strong>. Your USDC and yield-bearing tokens (USDY, syrupUSDC, etc.) sit in your own wallet (Phantom, Backpack, MetaMask, or a Privy-issued embedded wallet under your control). OXAR smart contracts have <strong>no administrative withdrawal keys</strong> over user funds.
        </p>
        <p className="mt-3">
          <strong>Group vaults</strong> use a pro-rata claim design: each member holds shares proportional to their contribution and may withdraw their portion at any time without group approval. There is no pooled investment decision-making.
        </p>
      </section>

      <section>
        <h2>5. Fiat on-ramp (Apple Pay / Google Pay)</h2>
        <p>
          The "tap to deposit" option uses <strong>Ramp Network</strong>, a licensed third-party payment processor (EMI / MTL / FCA depending on jurisdiction). Ramp Network is responsible for fiat KYC, AML, and fund transmission. OXAR does not handle fiat at any stage.
        </p>
      </section>

      <section>
        <h2>6. Yield sources are third parties</h2>
        <p>
          The yield sources we integrate (Ondo Finance, Maple Finance, Sky, Kamino, Jupiter, and others) are <strong>independent protocols and issuers</strong> with their own terms, risks, and compliance. We curate but do not operate them. Yield is paid by them, not us.
        </p>
      </section>

      <section>
        <h2>7. Risks you accept</h2>
        <p>By using OXAR you acknowledge:</p>
        <ul className="mt-3 list-none space-y-2">
          <li>→ <strong>Smart contract risk</strong> — bugs in OXAR or integrated protocols may result in loss of funds. We audit but cannot guarantee.</li>
          <li>→ <strong>Yield source risk</strong> — third-party protocols may depeg, default (Maple pools), or shut down. We disclose risk levels but do not insure.</li>
          <li>→ <strong>Stablecoin risk</strong> — USDC, USDT, and similar may de-peg from $1.</li>
          <li>→ <strong>Blockchain risk</strong> — network outages, transaction failures, fee spikes.</li>
          <li>→ <strong>Regulatory risk</strong> — the legal status of crypto, stablecoins, and DeFi protocols may change in your jurisdiction.</li>
          <li>→ <strong>Cross-chain bridge risk</strong> — when routing through Delora to Ethereum-based yields, bridge failures could cause loss.</li>
        </ul>
      </section>

      <section>
        <h2>8. Fees</h2>
        <p>
          OXAR charges a <strong>10% performance fee</strong> on yield earned (not on principal). The fee is taken at withdrawal and is fully transparent on-chain. Cross-chain swaps via Delora incur a small bridge fee (~0.1%). No deposit fees, no withdrawal penalties, no hidden charges.
        </p>
      </section>

      <section>
        <h2>9. No financial advice</h2>
        <p>
          Nothing on the Platform constitutes financial, investment, tax, or legal advice. Risk levels (Sleepy / Walking / Running) are informational categorizations, not recommendations tailored to your circumstances.
        </p>
      </section>

      <section>
        <h2>10. No warranty</h2>
        <p>
          The Platform is provided <strong>"as is"</strong> without warranties of any kind. We do not guarantee uptime, accuracy of displayed APYs (these change with market conditions), or fitness for any particular purpose.
        </p>
      </section>

      <section>
        <h2>11. Limitation of liability</h2>
        <p>
          In no event shall OXAR, its founders, contributors, or partners be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, smart contract failures, third-party protocol failures, or market movements.
        </p>
      </section>

      <section>
        <h2>12. Privacy</h2>
        <p>
          We minimize personal data collection. On-chain activity is publicly visible by nature of blockchain. We store metadata for invite codes, rule configurations, and notification preferences via Supabase. We do not sell user data.
        </p>
      </section>

      <section>
        <h2>13. Modifications</h2>
        <p>
          We may modify these terms at any time. Material changes will be announced via the Platform and effective on the date posted. Continued use constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>14. Contact</h2>
        <p>
          Questions about these terms: <a href="mailto:support@oxar.app">support@oxar.app</a>
        </p>
      </section>
    </DocPage>
  );
}
