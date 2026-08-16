import type { ReactNode } from "react";
import { PLATFORM_FEE_BPS } from "@oxar/sdk";
import { PLATFORM_FEE_POSSIBLE } from "@/lib/constants";

/**
 * The ONE copy of the terms prose. `web/src/app/terms/page.tsx` (the public,
 * off-domain page) and `TermsGateModal` (the in-app gate) both map over this
 * array rather than each spelling out the sections — so there is exactly one
 * place a legal-text edit can happen. Neither renders its own paragraph text;
 * both differ only in surrounding chrome (typography scale, chip nav, header).
 *
 * `id` doubles as the DOM anchor both surfaces scroll to; `short` is the
 * compact label used on the gate's jump chips (the full page doesn't need a
 * shorter label, so it isn't shown there).
 */
export interface TermsSection {
  id: string;
  heading: string;
  short: string;
  body: ReactNode;
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "acceptance",
    heading: "1. Acceptance",
    short: "acceptance",
    body: (
      <p>
        By accessing or using the OXAR platform ("Platform"), website oxar.app, app.oxar.app, or any associated services, you agree to be bound by these Terms. If you do not agree, do not use the Platform.
      </p>
    ),
  },
  {
    id: "what-oxar-is",
    heading: "2. What OXAR is",
    short: "what we are",
    body: (
      <>
        <p>
          OXAR is a <strong>non-custodial software interface</strong>. It routes user-owned USDC into curated third-party yield sources — currently including Jupiter Lend, Ondo USDY, and Maple's syrupUSDC — and it lets you buy and hold market-priced assets such as tokenized US stocks and gold in your own wallet. The exact catalog changes over time; what's currently live is always shown in the app.
        </p>
        <p className="mt-3">
          We <strong>are not</strong> a bank, broker, custodian, money transmitter, investment advisor, or securities issuer. We do not hold your funds. We do not make investment decisions on your behalf.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    heading: "3. Eligibility",
    short: "eligibility",
    body: (
      <p>
        You must be at least 18 years old and legally capable of entering into binding agreements in your jurisdiction. The Platform is not available where its use would violate applicable law. Certain jurisdictions may be geo-blocked at our discretion.
      </p>
    ),
  },
  {
    id: "non-custodial",
    heading: "4. Non-custodial design",
    short: "non-custodial",
    body: (
      <p>
        OXAR is <strong>fully non-custodial</strong>. Your USDC and any yield-bearing or price-exposure tokens (USDY, syrupUSDC, tokenized stocks, gold, etc.) sit in your own wallet (Phantom, Backpack, MetaMask, or a Privy-issued embedded wallet under your control). OXAR runs <strong>no smart contract of its own</strong> — there is no admin key over your funds because there is no OXAR contract for one to exist in. The app builds transactions; your wallet signs them.
      </p>
    ),
  },
  {
    id: "onramp",
    heading: "5. Fiat on-ramp (Apple Pay / Google Pay / card)",
    short: "on-ramp",
    body: (
      <p>
        The "tap to deposit" option uses <strong>Privy's on-ramp</strong>, which routes to licensed third-party payment processors responsible for fiat KYC, AML, and fund transmission. OXAR does not handle fiat at any stage.
      </p>
    ),
  },
  {
    id: "yield-sources",
    heading: "6. Yield sources are third parties",
    short: "yield sources",
    body: (
      <p>
        The yield sources we integrate (currently Jupiter Lend, Ondo Finance, Maple Finance, OnRe, and others) are <strong>independent protocols and issuers</strong> with their own terms, risks, and compliance. We curate but do not operate them. Yield is paid by them, not us.
      </p>
    ),
  },
  {
    id: "stocks-gold",
    heading: "7. Tokenized stocks and gold",
    short: "stocks & gold",
    body: (
      <>
        <p>
          Some assets on the Platform give you price exposure rather than yield: tokenized US stocks (e.g. Backed Finance's "xStocks", plus a small set of Ondo Global Markets tokens) and tokenized gold. These are tokens issued by third parties, tracking the price of the underlying stock or commodity — <strong>they are not securities issued by OXAR</strong>, and OXAR is not the issuer, broker, or market maker for any of them.
        </p>
        <p className="mt-3">
          Buying and selling these tokens happens on public, on-chain markets, and the price you get is set by that market, not by OXAR. Market depth is limited and can vary a lot between assets and over time: a large position may not be sellable in a single transaction, the amount that can be sold at once is asset-specific and can stay low for months, and getting out immediately after buying in can itself cost a noticeable fraction of the position on some assets — the app shows you an estimate of this cost before you buy. None of this is a fee OXAR charges; it is the underlying market's liquidity.
        </p>
        <p className="mt-3">
          Access to tokenized US stocks is <strong>geo-restricted</strong> (a Reg S–style block on US persons and certain jurisdictions) and may change without notice as the underlying issuers' compliance requirements change. Tokenized gold is a commodity-tracking token, not a security, and is not subject to this block.
        </p>
      </>
    ),
  },
  {
    id: "risks",
    heading: "8. Risks you accept",
    short: "risks",
    body: (
      <>
        <p>
          Two things can lose you money here, and neither of them is OXAR taking it. Everything below follows from them.
        </p>
        <ul className="mt-3 list-none space-y-2">
          <li>→ <strong>The yield is someone else&rsquo;s business</strong> — your money goes into third-party protocols (Jupiter Lend, Maple, OnRe and others). They can pay less than advertised, pause, default, or fail outright, and their code can contain bugs. OXAR runs no contract of its own, but that also means we cannot fix theirs. We show what we know about each; we insure nothing.</li>
          <li>→ <strong>The stocks and gold are real markets</strong> — they track real prices and real depth. The price moves against you between the quote and the trade, and a large position may not be sellable in one go; how much can be sold at once varies by asset and can stay low for months. The app shows you what leaving would cost before you buy, but it cannot make a market deeper than it is.</li>
          <li>→ <strong>Dollars on a blockchain are not bank dollars</strong> — USDC, USDT and similar can de-peg from $1, networks stall, transactions fail, fees spike.</li>
          <li>→ <strong>Paying from another chain adds a bridge</strong> — a cross-chain deposit routes through Delora, and a bridge that stalls or fails mid-transfer can delay or lose funds.</li>
          <li>→ <strong>The rules can change</strong> — the legal status of crypto, stablecoins and tokenized securities may change where you live, including in ways that cut off access to what you already hold.</li>
        </ul>
      </>
    ),
  },
  {
    id: "fees",
    heading: "9. Fees",
    short: "fees",
    body: PLATFORM_FEE_POSSIBLE ? (
      <p>
        <strong>OXAR charges no fee on deposits, withdrawals, or yield earned</strong> — there is no performance fee, no deposit fee, and no withdrawal penalty. Money that sits and earns costs you nothing.
        {" "}
        <strong>OXAR charges {(PLATFORM_FEE_BPS / 100).toFixed(2)}% on a conversion</strong> — buying or selling an asset that has to be swapped, where dollars are one side of the trade. It is shown as its own line on the confirmation screen before you sign, and if that line is not there, no OXAR fee applies to that transaction. Depositing dollars into a dollar product is not a conversion and costs nothing.
        {" "}
        A separate cost comes from elsewhere: a swap-and-hold asset — tokenized stocks, gold, or Ondo USDY — has a one-time swap cost set by the market at the time of the trade, same as any on-chain swap; it is not collected by OXAR.
      </p>
    ) : (
      <p>
        <strong>OXAR charges no fee of its own</strong> on deposits, withdrawals, or yield earned — there is no performance fee, no deposit fee, and no withdrawal penalty. One cost comes from elsewhere: buying or selling a swap-and-hold asset — tokenized stocks, gold, or Ondo USDY — has a one-time swap cost set by the market at the time of the trade, same as any on-chain swap; it is not collected by OXAR.
      </p>
    ),
  },
  {
    id: "no-advice",
    heading: "10. No financial advice",
    short: "no advice",
    body: (
      <p>
        Nothing on the Platform constitutes financial, investment, tax, or legal advice. Risk levels (Sleepy / Walking / Running) are informational categorizations, not recommendations tailored to your circumstances.
      </p>
    ),
  },
  {
    id: "no-warranty",
    heading: "11. No warranty",
    short: "no warranty",
    body: (
      <p>
        The Platform is provided <strong>"as is"</strong> without warranties of any kind. We do not guarantee uptime, accuracy of displayed APYs (these change with market conditions), or fitness for any particular purpose.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "12. Limitation of liability",
    short: "liability",
    body: (
      <p>
        In no event shall OXAR, its founders, contributors, or partners be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, smart contract failures, third-party protocol failures, or market movements.
      </p>
    ),
  },
  {
    id: "privacy",
    heading: "13. Privacy",
    short: "privacy",
    body: (
      <p>
        We minimize personal data collection. On-chain activity is publicly visible by nature of blockchain. We store metadata for invite codes, rule configurations, and notification preferences via Supabase. We do not sell user data.
      </p>
    ),
  },
  {
    id: "modifications",
    heading: "14. Modifications",
    short: "changes",
    body: (
      <p>
        We may modify these terms at any time. Material changes will be announced via the Platform and effective on the date posted. Continued use constitutes acceptance.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "15. Contact",
    short: "contact",
    body: (
      <p>
        Questions about these terms: <a href="mailto:support@oxar.app">support@oxar.app</a>
      </p>
    ),
  },
];
