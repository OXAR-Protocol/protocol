/**
 * Curated, human descriptions of what each asset/position actually IS — so a
 * user knows what they're putting money into. Plain language, no finance
 * jargon (brand voice). All NUMBERS (price, APY, 24h, P&L) stay live; only this
 * descriptive text is hand-written. Keyed by the same ids as the catalogs
 * (xstocks / gold / YIELD_SOURCES). Missing key → page falls back to the
 * source's own `description`.
 */
import { ASSET_INFO_UK as UK_INFO } from "./asset-info-uk";

export interface AssetFact {
  label: string;
  value: string;
}

export interface AssetInfo {
  /** One or two plain sentences: what it is and what it does. */
  about: string;
  /** Short tag, e.g. "us stock · technology" / "yield · lending". */
  category: string;
  /** A few key facts — kept short on purpose. */
  facts?: AssetFact[];
}

export const ASSET_INFO: Record<string, AssetInfo> = {
  // ── Indices ─────────────────────────────────────────────
  "xstock-spy": {
    about: "Owning a slice of the S&P 500 — the 500 biggest public companies in the US, bundled together. The standard way people bet on the US economy as a whole.",
    category: "us stock · index",
    facts: [{ label: "tracks", value: "500 largest US companies" }, { label: "type", value: "broad-market index" }],
  },
  "xstock-qqq": {
    about: "The Nasdaq-100 — the 100 largest non-financial companies on the Nasdaq, heavily weighted toward big tech. Tech-tilted version of buying the market.",
    category: "us stock · index",
    facts: [{ label: "tracks", value: "100 largest Nasdaq companies" }, { label: "tilt", value: "technology-heavy" }],
  },

  // ── Mega-cap tech ───────────────────────────────────────
  "xstock-aapl": {
    about: "Apple makes the iPhone, Mac, iPad and AirPods, plus a fast-growing services business (App Store, iCloud, Apple Pay). One of the most valuable companies on earth.",
    category: "us stock · technology",
    facts: [{ label: "sector", value: "consumer electronics & services" }, { label: "hq", value: "Cupertino, USA" }],
  },
  "xstock-msft": {
    about: "Microsoft makes Windows, Office and the Azure cloud, and owns a big stake in OpenAI. Sells mostly to businesses, so revenue is steady and recurring.",
    category: "us stock · technology",
    facts: [{ label: "sector", value: "software & cloud" }, { label: "hq", value: "Redmond, USA" }],
  },
  "xstock-nvda": {
    about: "NVIDIA designs the GPUs that train and run modern AI. Its chips power most of the world's AI data centres — the picks-and-shovels of the AI boom.",
    category: "us stock · semiconductors",
    facts: [{ label: "sector", value: "AI chips & accelerators" }, { label: "hq", value: "Santa Clara, USA" }],
  },
  "xstock-googl": {
    about: "Alphabet is Google's parent — Search, YouTube, Android, Chrome and the Google Cloud, plus the Gemini AI models. Most of the money still comes from ads.",
    category: "us stock · technology",
    facts: [{ label: "sector", value: "internet & advertising" }, { label: "hq", value: "Mountain View, USA" }],
  },
  "xstock-amzn": {
    about: "Amazon runs the world's biggest online store and AWS, the cloud platform a huge chunk of the internet is built on. Retail brings the scale, AWS brings the profit.",
    category: "us stock · technology",
    facts: [{ label: "sector", value: "e-commerce & cloud" }, { label: "hq", value: "Seattle, USA" }],
  },
  "xstock-meta": {
    about: "Meta owns Facebook, Instagram, WhatsApp and Threads — billions of users, an advertising machine, and a big bet on AI and the metaverse.",
    category: "us stock · technology",
    facts: [{ label: "sector", value: "social media & advertising" }, { label: "hq", value: "Menlo Park, USA" }],
  },
  "xstock-tsla": {
    about: "Tesla builds electric cars, batteries and solar, and is chasing self-driving and humanoid robots. A carmaker that trades like a tech bet.",
    category: "us stock · automotive",
    facts: [{ label: "sector", value: "EVs & energy" }, { label: "hq", value: "Austin, USA" }],
  },
  "xstock-avgo": {
    about: "Broadcom makes networking and custom chips plus enterprise software (VMware). A quieter giant that's deep inside data centres and AI infrastructure.",
    category: "us stock · semiconductors",
    facts: [{ label: "sector", value: "chips & infrastructure software" }, { label: "hq", value: "Palo Alto, USA" }],
  },
  "xstock-orcl": {
    about: "Oracle sells databases and enterprise software, and is now a fast-growing cloud provider renting out compute for AI workloads.",
    category: "us stock · technology",
    facts: [{ label: "sector", value: "databases & cloud" }, { label: "hq", value: "Austin, USA" }],
  },
  "xstock-pltr": {
    about: "Palantir builds data and AI software for governments and large companies — turning messy data into decisions. Polarising, fast-growing, AI-driven.",
    category: "us stock · software",
    facts: [{ label: "sector", value: "data & AI software" }, { label: "hq", value: "Denver, USA" }],
  },
  // ── Crypto-adjacent ─────────────────────────────────────
  "xstock-coin": {
    about: "Coinbase is the largest US crypto exchange — buy/sell, custody, staking and the Base chain. A regulated way to bet on crypto adoption itself.",
    category: "us stock · crypto",
    facts: [{ label: "sector", value: "crypto exchange" }, { label: "hq", value: "USA (remote-first)" }],
  },
  "xstock-hood": {
    about: "Robinhood is the app that made commission-free stock and crypto trading mainstream, especially with younger investors. Now expanding into wallets and retirement.",
    category: "us stock · fintech",
    facts: [{ label: "sector", value: "brokerage & fintech" }, { label: "hq", value: "Menlo Park, USA" }],
  },
  "xstock-mstr": {
    about: "MicroStrategy (Strategy) is a software company that became the biggest corporate holder of Bitcoin — its stock trades largely as a leveraged Bitcoin proxy.",
    category: "us stock · crypto",
    facts: [{ label: "sector", value: "bitcoin treasury" }, { label: "hq", value: "Tysons, USA" }],
  },
  "xstock-crcl": {
    about: "Circle issues USDC, one of the largest dollar stablecoins. Earns mostly from the interest on the reserves backing each coin — a bet on stablecoin growth.",
    category: "us stock · crypto",
    facts: [{ label: "sector", value: "stablecoin issuer" }, { label: "hq", value: "New York, USA" }],
  },

  // ── Other large-caps ────────────────────────────────────
  "xstock-unh": {
    about: "UnitedHealth is the biggest US health insurer plus Optum, its health-services arm. Defensive, huge, and tied to US healthcare spending.",
    category: "us stock · healthcare",
    facts: [{ label: "sector", value: "health insurance & services" }, { label: "hq", value: "Minnetonka, USA" }],
  },
  "xstock-lly": {
    about: "Eli Lilly is a pharma giant behind blockbuster weight-loss and diabetes drugs (Mounjaro, Zepbound). Growth has been driven by the GLP-1 wave.",
    category: "us stock · healthcare",
    facts: [{ label: "sector", value: "pharmaceuticals" }, { label: "hq", value: "Indianapolis, USA" }],
  },
  "xstock-wmt": {
    about: "Walmart is the world's largest retailer by revenue — groceries and everything else, in-store and online. A steady, defensive consumer staple.",
    category: "us stock · consumer",
    facts: [{ label: "sector", value: "retail" }, { label: "hq", value: "Bentonville, USA" }],
  },
  "xstock-ko": {
    about: "Coca-Cola sells the world's best-known drinks brands in nearly every country. Slow-growing but remarkably steady — a classic defensive dividend name.",
    category: "us stock · consumer",
    facts: [{ label: "sector", value: "beverages" }, { label: "hq", value: "Atlanta, USA" }],
  },
  "xstock-mcd": {
    about: "McDonald's is the largest fast-food chain on earth, and as much a real-estate and franchising business as a burger one. Defensive and global.",
    category: "us stock · consumer",
    facts: [{ label: "sector", value: "restaurants & franchising" }, { label: "hq", value: "Chicago, USA" }],
  },

  // ── Special ─────────────────────────────────────────────
  "xstock-gld": {
    about: "Exposure to gold — the classic store of value people reach for when they want something outside stocks and currencies. Tracks the gold price, no yield.",
    category: "commodity · gold",
    facts: [{ label: "tracks", value: "spot gold price" }, { label: "role", value: "hedge / store of value" }],
  },
  "xstock-spcx": {
    about: "Tokenized exposure to SpaceX — Elon Musk's private rocket and Starlink satellite-internet company. A rare way to touch a company that isn't publicly listed.",
    category: "private company · aerospace",
    facts: [{ label: "sector", value: "rockets & satellite internet" }, { label: "note", value: "privately held — pre-IPO exposure" }],
  },
  "gold-xaut": {
    about: "Tether Gold (XAUt) — each token is backed by one troy ounce of real, physical gold held in a Swiss vault. Hold gold without a safe or a bank.",
    category: "commodity · gold",
    facts: [{ label: "backed by", value: "physical gold (1 token ≈ 1 oz)" }, { label: "issuer", value: "Tether" }],
  },

  // ── Yield sources ───────────────────────────────────────
  "jupiter-lend-usdc": {
    about: "Your dollars are lent out on Jupiter Lend, Solana's largest lending market, to borrowers who post collateral. You earn the interest they pay. Withdraw any time.",
    category: "yield · lending",
    facts: [{ label: "earns from", value: "over-collateralised borrowers" }, { label: "where", value: "Jupiter (Solana)" }, { label: "risk", value: "low" }],
  },
  "jupiter-lend-usdt": {
    about: "Same Jupiter Lend market, denominated in USDT — your digital dollars earn the interest borrowers pay. Withdraw any time.",
    category: "yield · lending",
    facts: [{ label: "earns from", value: "over-collateralised borrowers" }, { label: "where", value: "Jupiter (Solana)" }, { label: "risk", value: "low" }],
  },
  "jupiter-lend-usdg": {
    about: "Same Jupiter Lend market, denominated in USDG — your digital dollars earn the interest borrowers pay. Withdraw any time.",
    category: "yield · lending",
    facts: [{ label: "earns from", value: "over-collateralised borrowers" }, { label: "where", value: "Jupiter (Solana)" }, { label: "risk", value: "low" }],
  },
  "ondo-usdy": {
    about: "USDY is backed by short-term US Treasuries — essentially lending to the US government. The token's price rises as interest accrues; holding it earns. Swap out any time.",
    category: "yield · treasuries",
    facts: [{ label: "earns from", value: "US T-bills" }, { label: "issuer", value: "Ondo Finance" }, { label: "risk", value: "low" }],
  },
  "kamino-usdc": {
    about: "Your USDC is lent out on Kamino, a big Solana lending market, to borrowers who post collateral. You earn the interest they pay. Withdraw any time.",
    category: "yield · lending",
    facts: [{ label: "earns from", value: "over-collateralised borrowers" }, { label: "where", value: "Kamino (Solana)" }, { label: "risk", value: "low" }],
  },
  "marginfi-usdc": {
    about: "USDC lent on MarginFi, another Solana money market — same idea as Kamino, an alternative venue. You earn borrower interest, withdraw any time.",
    category: "yield · lending",
    facts: [{ label: "earns from", value: "over-collateralised borrowers" }, { label: "where", value: "MarginFi (Solana)" }, { label: "risk", value: "low" }],
  },
  jlp: {
    about: "The Jupiter Perps liquidity pool. You provide liquidity that traders borrow against, and earn a share of their trading and borrowing fees. Higher reward, more market risk.",
    category: "yield · liquidity",
    facts: [{ label: "earns from", value: "perp trading & borrow fees" }, { label: "where", value: "Jupiter (Solana)" }, { label: "risk", value: "medium" }],
  },
  "maple-solana": {
    about: "Maple lends pooled USDC to vetted institutions (trading firms, market makers) at fixed terms. Higher yield than open lending, with credit risk on the borrowers.",
    category: "yield · private credit",
    facts: [{ label: "earns from", value: "institutional borrowers" }, { label: "where", value: "Maple (Solana)" }, { label: "risk", value: "medium" }],
  },
  "drift-insurance": {
    about: "You backstop the Drift perps exchange: deposits cover rare shortfalls in exchange for a share of fees. Steady yield, but funds can be drawn on in extreme events.",
    category: "yield · insurance fund",
    facts: [{ label: "earns from", value: "exchange fees" }, { label: "where", value: "Drift (Solana)" }, { label: "risk", value: "medium" }],
  },
  "mountain-usdm": {
    about: "USDM pays you the yield on short-term US Treasuries — essentially lending to the US government. Regulated issuer, daily accrual, low risk.",
    category: "yield · treasuries",
    facts: [{ label: "earns from", value: "US T-bills" }, { label: "issuer", value: "Mountain Protocol" }, { label: "risk", value: "low" }],
  },
  "openeden-tbill": {
    about: "OpenEden's TBILL puts you into a fund of US Treasury bills with daily NAV. Institutional-grade, low risk — the boring-but-safe end of the menu.",
    category: "yield · treasuries",
    facts: [{ label: "earns from", value: "US T-bills" }, { label: "issuer", value: "OpenEden" }, { label: "risk", value: "low" }],
  },
  "sky-sdai": {
    about: "sDAI earns the Sky (formerly MakerDAO) savings rate — interest paid to holders of the DAI/USDS stablecoin. A long-running, battle-tested DeFi yield.",
    category: "yield · savings rate",
    facts: [{ label: "earns from", value: "Sky savings rate" }, { label: "where", value: "Sky / Ethereum" }, { label: "risk", value: "low" }],
  },
};

/** Look up curated info for an asset/source id, in the requested language
 *  (Ukrainian falls back to English per-entry). */
export function getAssetInfo(id: string, locale?: string): AssetInfo | undefined {
  if (locale === "uk") {
    // Lazy import avoided on purpose — the UK map is small text, statically bundled.
    return UK_INFO[id] ?? ASSET_INFO[id];
  }
  return ASSET_INFO[id];
}
