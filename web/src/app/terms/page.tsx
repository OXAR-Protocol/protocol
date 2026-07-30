import { DocPage } from "@/components/landing-v2/doc-page";

export const metadata = {
  title: "OXAR — Terms of Use",
};

export default function TermsPage() {
  return (
    <DocPage label="legal" title="terms of use">
      <p><strong>Last updated:</strong> July 30, 2026</p>

      <section>
        <h2>1. Acceptance</h2>
        <p>
          By accessing or using the OXAR platform ("Platform"), website oxar.app, app.oxar.app, or any associated services, you agree to be bound by these Terms. If you do not agree, do not use the Platform.
        </p>
      </section>

      <section>
        <h2>2. What OXAR is</h2>
        <p>
          OXAR is a <strong>non-custodial software interface</strong>. It routes user-owned USDC into curated third-party yield sources — currently including Jupiter Lend, Ondo USDY, and Maple's syrupUSDC — and it lets you buy and hold market-priced assets such as tokenized US stocks and gold in your own wallet. The exact catalog changes over time; what's currently live is always shown in the app.
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
          OXAR is <strong>fully non-custodial</strong>. Your USDC and any yield-bearing or price-exposure tokens (USDY, syrupUSDC, tokenized stocks, gold, etc.) sit in your own wallet (Phantom, Backpack, MetaMask, or a Privy-issued embedded wallet under your control). OXAR smart contracts have <strong>no administrative withdrawal keys</strong> over user funds.
        </p>
      </section>

      <section>
        <h2>5. Fiat on-ramp (Apple Pay / Google Pay / card)</h2>
        <p>
          The "tap to deposit" option uses <strong>Privy's on-ramp</strong>, which routes to licensed third-party payment processors responsible for fiat KYC, AML, and fund transmission. OXAR does not handle fiat at any stage.
        </p>
      </section>

      <section>
        <h2>6. Yield sources are third parties</h2>
        <p>
          The yield sources we integrate (currently Jupiter Lend, Ondo Finance, Maple Finance, OnRe, and others) are <strong>independent protocols and issuers</strong> with their own terms, risks, and compliance. We curate but do not operate them. Yield is paid by them, not us.
        </p>
      </section>

      <section>
        <h2>7. Tokenized stocks and gold</h2>
        <p>
          Some assets on the Platform give you price exposure rather than yield: tokenized US stocks (e.g. Backed Finance's "xStocks", plus a small set of Ondo Global Markets tokens) and tokenized gold. These are tokens issued by third parties, tracking the price of the underlying stock or commodity — <strong>they are not securities issued by OXAR</strong>, and OXAR is not the issuer, broker, or market maker for any of them.
        </p>
        <p className="mt-3">
          Buying and selling these tokens happens on public, on-chain markets, and the price you get is set by that market, not by OXAR. Market depth is limited and can vary a lot between assets and over time: a large position may not be sellable in a single transaction, the amount that can be sold at once is asset-specific and can stay low for months, and getting out immediately after buying in can itself cost a noticeable fraction of the position on some assets — the app shows you an estimate of this cost before you buy. None of this is a fee OXAR charges; it is the underlying market's liquidity.
        </p>
        <p className="mt-3">
          Access to tokenized US stocks is <strong>geo-restricted</strong> (a Reg S–style block on US persons and certain jurisdictions) and may change without notice as the underlying issuers' compliance requirements change. Tokenized gold is a commodity-tracking token, not a security, and is not subject to this block.
        </p>
      </section>

      <section>
        <h2>8. Risks you accept</h2>
        <p>By using OXAR you acknowledge:</p>
        <ul className="mt-3 list-none space-y-2">
          <li>→ <strong>Smart contract risk</strong> — bugs in OXAR or integrated protocols may result in loss of funds. We audit but cannot guarantee.</li>
          <li>→ <strong>Yield source risk</strong> — third-party protocols may depeg, default (e.g. Maple pools), or shut down. We disclose risk levels but do not insure.</li>
          <li>→ <strong>Market / liquidity risk</strong> — tokenized stocks and gold track real-market prices and real-market depth; you may not be able to exit a large position in one transaction, and the price can move against you between quotes.</li>
          <li>→ <strong>Stablecoin risk</strong> — USDC, USDT, and similar may de-peg from $1.</li>
          <li>→ <strong>Blockchain risk</strong> — network outages, transaction failures, fee spikes.</li>
          <li>→ <strong>Regulatory risk</strong> — the legal status of crypto, stablecoins, tokenized securities, and DeFi protocols may change in your jurisdiction.</li>
          <li>→ <strong>Cross-chain bridge risk</strong> — when routing through Delora to Ethereum-based yields, bridge failures could cause loss.</li>
        </ul>
      </section>

      <section>
        <h2>9. Fees</h2>
        <p>
          <strong>OXAR charges no fee of its own</strong> on deposits, withdrawals, or yield earned — there is no performance fee, no deposit fee, and no withdrawal penalty. Two costs come from elsewhere: cross-chain swaps routed through Delora (bridging to Ethereum-based yields) carry a small integrator markup (~0.1%), configured by OXAR and collected by Delora as part of the quote. We disclose it here rather than characterise who ultimately receives it, because that depends on Delora&rsquo;s integrator terms. And buying or selling a swap-and-hold asset — tokenized stocks, gold, or Ondo USDY — has a one-time swap cost set by the market at the time of the trade, same as any on-chain swap; it is not collected by OXAR.
        </p>
      </section>

      <section>
        <h2>10. No financial advice</h2>
        <p>
          Nothing on the Platform constitutes financial, investment, tax, or legal advice. Risk levels (Sleepy / Walking / Running) are informational categorizations, not recommendations tailored to your circumstances.
        </p>
      </section>

      <section>
        <h2>11. No warranty</h2>
        <p>
          The Platform is provided <strong>"as is"</strong> without warranties of any kind. We do not guarantee uptime, accuracy of displayed APYs (these change with market conditions), or fitness for any particular purpose.
        </p>
      </section>

      <section>
        <h2>12. Limitation of liability</h2>
        <p>
          In no event shall OXAR, its founders, contributors, or partners be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, smart contract failures, third-party protocol failures, or market movements.
        </p>
      </section>

      <section>
        <h2>13. Privacy</h2>
        <p>
          We minimize personal data collection. On-chain activity is publicly visible by nature of blockchain. We store metadata for invite codes, rule configurations, and notification preferences via Supabase. We do not sell user data.
        </p>
      </section>

      <section>
        <h2>14. Modifications</h2>
        <p>
          We may modify these terms at any time. Material changes will be announced via the Platform and effective on the date posted. Continued use constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>15. Contact</h2>
        <p>
          Questions about these terms: <a href="mailto:support@oxar.app">support@oxar.app</a>
        </p>
      </section>
    </DocPage>
  );
}
