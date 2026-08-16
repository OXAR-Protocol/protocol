import { DocPage } from "@/components/landing-v2/doc-page";

export const metadata = {
  title: "OXAR — For Investors",
};

export default function InvestorsPage() {
  return (
    <DocPage label="for investors" title="oxar">
      <p><strong>Where does your money sleep? Wake it up. Earn yield. Own real assets.</strong></p>

      <section>
        <h2>1. One-liner</h2>
        <p>
          OXAR is a <strong>savings-and-investing app for the crypto-paid generation</strong>. Connect a wallet (Apple Pay deposits on the way), choose how loud you want your money, and earn yield from curated sources — or buy tokenized stocks and gold to hold. Withdraw anytime, never custodial.
        </p>
      </section>

      <section>
        <h2>2. The problem</h2>
        <p>
          Banks force a choice: <strong>high yield or instant access</strong>, never both. Crypto wallets sit at 0%. Savings apps cap at 4-5% and require a US bank account.
        </p>
        <p className="mt-3">
          And the moment you want more than a savings rate — stocks, gold, bonds — you're back in the legacy system: a broker, more KYC, market hours, waiting. We break the tradeoff: <strong>5-12% APY</strong> across curated yield sources, <strong>instant withdraw</strong> from liquid positions, and <strong>tokenized real-world assets</strong> — one non-custodial app.
        </p>
      </section>

      <section>
        <h2>3. The product</h2>
        <p>
          <strong>Connect your wallet</strong> (Phantom, Backpack, MetaMask). Apple Pay / Google Pay deposits via Ramp Network are on the way. Pick a risk template: Sleepy (4-6%), Walking (6-9%), Running (9-14%).
        </p>
        <p className="mt-3">
          Your USDC routes into <strong>curated yield sources</strong>: Jupiter Lend, Ondo USDY (US Treasuries) and Maple (institutional credit) live today, with more on the way. Cross-chain access via Delora — no bridges to manage.
        </p>
        <p className="mt-3">
          Beyond yield, buy <strong>tokenized stocks and gold</strong> (Backed xStocks, Tether Gold) and hold them in your own wallet — real price exposure with on-chain P&amp;L. Each asset has its own page explaining what it is. <strong>Tokenized bonds</strong> and new asset classes are next.
        </p>
      </section>

      <section>
        <h2>4. Why now</h2>
        <p>
          Crypto-paid workforce is real and growing: Bitwage (150k+ workers), Toku (100+ countries), Deel crypto payroll, Superfluid streaming. <strong>Tokenized RWA is maturing</strong>: Ondo USDY ($500M+), Maple ($1B+), tokenized stocks via Backed. Apple Pay → crypto via licensed providers like Ramp Network just became frictionless.
        </p>
        <p className="mt-3">
          Banks (Apple, Wealthfront, Marcus) cap at 4-5% because of US Treasury rates. Crypto-native users want more without taking obscure risks. <strong>This window opens for the next 12-24 months</strong> before Revolut / Coinbase close it.
        </p>
      </section>

      <section>
        <h2>5. Market</h2>
        <p>
          An earlier version of this section sized the market as “~50M people with a crypto wallet and a savings instinct.” That was a feel, not a figure, and nobody could check it. Sized below in idle dollars instead — the unit the problem is actually measured in, and one a reader can verify.
        </p>
        <p className="mt-3">
          <strong>TAM — $295B.</strong> Total stablecoin supply was <strong>$312B</strong> in Q2 2026, and yield-bearing stablecoins account for roughly 4–5% of it (~$11B). So something on the order of <strong>95% of on-chain dollars earn nothing at all</strong>. Estimates of the yield-bearing share range from ~$4.6B to ~$19B depending on whose definition you take, which puts idle supply between 94% and 98.5% — we use the conservative end. That money sits across <strong>150M+ addresses</strong> holding a non-zero stablecoin balance, with <strong>47M monthly active</strong> stablecoin users.
        </p>
        <p className="mt-3">
          <strong>SAM — $15B.</strong> Solana carries <strong>$16.7B</strong> of stablecoin supply, about 4% of the global market, USDC roughly three-quarters of it. Applying the same idle share gives ~$15B of dollars sitting still on the chain the product is built on — money we can reach without asking anyone to bridge, install a second wallet, or learn what a bridge is. (Applying a global idle ratio to one chain is our extrapolation, not a published figure.)
        </p>
        <p className="mt-3">
          <strong>SOM (Year 1) — $3M.</strong> Derived from the SAM rather than from what people told us they might deposit: <strong>two basis points</strong> of the $15B of idle Solana float. The cross-check is a published figure, not a survey — $312B held across 150M+ addresses averages <strong>~$2,080 per address</strong>, so $3M is roughly 1,400 savers, which is a plausible first year for a product with nothing spent on acquisition. (Our waitlist did volunteer deposit amounts, and they sum to $75k, but a free-text field where someone can type any number is a signal of interest, not a basis for a forecast.) Note what this does <em>not</em> imply about revenue: deposits that sit still earn us nothing, so TVL is the wrong number to forecast income from — see section 6.
        </p>
        <p className="mt-3 text-sm">
          Sources: Artemis stablecoin analytics and Visa Onchain Analytics (supply, holders, monthly actives), Q2 2026; Solana supply per Chainstack’s 2026 stablecoin review. Figures move monthly — re-check before quoting.
        </p>
      </section>

      <section>
        <h2>6. Business model</h2>
        <p>
          <strong>0.25% on a conversion.</strong> Buying or selling anything that has to be swapped, where dollars are one side of the trade. Putting dollars into a dollar product is not a conversion and costs nothing. The fee is always taken in USDC, so it lands in one account with no dust to sweep.
        </p>
        <p className="mt-3">
          <strong>A cut of the yield cannot work here, and we stopped pretending otherwise.</strong> An earlier version of this memo named a 10% performance fee as the intended model and did the arithmetic off it. That model requires custody: the position sits in the user’s own wallet, on a public market, and we are not in the flow when they exit — anyone could bypass us by connecting the same wallet to the protocol directly. A vault contract would fix that and would also break the one thing we sell. So the fee sits on the conversion, which is the part we actually perform.
        </p>
        <p className="mt-3">
          <strong>The price is the argument.</strong> Revolut charges 1.49% to convert on a standard account plus a 1.5–2.5% spread, and pays 2.33% on dollars unless you buy a higher tier. Phantom takes 0.85% on the same swap and hides it inside the quote; MetaMask 0.875%; Rabby 0.25%. We take 0.25% and print it as its own line on the confirmation screen before the user signs. Our terms say the same, and add the clause that makes it checkable: if that line is not there, no OXAR fee applied to that transaction.
        </p>
        <p className="mt-3">
          <strong>Revenue tracks turnover, not deposits</strong> — roughly $1 for every $400 swapped. $10M of deposits that never move earns us nothing. That is the honest cost of building for savers rather than traders, and it is why distribution, not TVL, is the number that matters first.
        </p>
        <p className="mt-3">
          <strong>Built and switched off.</strong> The machinery is live in production behind two independent switches — a feature flag and a fee account — and neither is set, so nobody has paid anything. A cross-chain integrator markup of ~0.1% existed until 2026-07-30 and was turned off after earning $0.16 in total, on $162.81 of volume, from one user who was us testing. That number is the most honest measure of our current scale.
        </p>
      </section>

      <section>
        <h2>7. Status & roadmap</h2>
        <p>
          <strong>Now:</strong> Live on Solana <strong>mainnet</strong> — a non-custodial UI over audited protocol SDKs (Jupiter Lend, Ondo, Maple, Onre), with no contract of our own to deploy or audit. USDC yield plus tokenized stocks and gold work end-to-end: deposit → earn, or buy → hold → withdraw, all from your own wallet.
        </p>
        <p className="mt-3">
          <strong>Next:</strong> Open the door. The product is in closed alpha behind an email allowlist; Apple Pay funding, gasless deposits, a live portfolio and English/Ukrainian are all shipped. What is missing is people, not features.
        </p>
        <p className="mt-3">
          <strong>Q4 2026:</strong> Assets from issuers Jupiter cannot route today, and from Backpack Securities — a US broker-dealer whose tokenized equities quote a round trip better than most of our current shelf. Euro yield, once lend positions are priced in their own currency rather than assumed to be dollars.
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
        <p>Strategic interest, partnership, or grant intro? Reach out:</p>
        <p className="mt-3"><a href="mailto:support@oxar.app">support@oxar.app</a></p>
        <p className="mt-3">
          Telegram: <a href="https://t.me/eternaki">@eternaki</a> (Daniel) · <a href="https://t.me/tarapatska">@tarapatska</a> (Anna)
        </p>
      </section>
    </DocPage>
  );
}
