/**
 * English — the source of truth for translation keys. Copy follows the
 * "simple mode" rule: lead with dollars, not tokens (see
 * docs/plans/2026-07-04-simple-mode-i18n-design.md). Token symbols stay in
 * data chips; sentences say "dollars".
 */
export const en = {
  // Navigation
  "nav.home": "home",
  "nav.yield": "yield",
  "nav.pile": "pile",
  "nav.you": "you",

  // Greetings
  "greet.late": "Up late",
  "greet.morning": "Good morning",
  "greet.afternoon": "Good afternoon",
  "greet.evening": "Good evening",

  // Home
  "home.sleepingMoney": "your sleeping money",
  "home.sources.one": "{n} source · earning every block",
  "home.sources.many": "{n} sources · earning every block",
  "home.empty.cta": "drop dollars into a source to start earning",
  "home.startHere": "start here",
  "home.napping1": "your money's been napping.",
  "home.napping2": "let's wake it up.",
  "home.empty.body":
    "pick a source. add dollars. earn from day one. withdraw whenever you want — the money always stays yours.",
  "home.wakeUp": "wake up your money",
  "home.whereSleeping": "where it's sleeping",
  "home.manage": "manage →",
  "home.recentActivity": "recent activity",
  "home.earned.yield": "yield",
  "home.earned.stocks": "stocks",
  "home.earned.gold": "gold",

  // Yield list
  "yield.title": "Where your money can sleep",
  "yield.subtitle":
    "Pick a source. Open it. Add dollars. Withdraw anytime. Money goes straight into the source — it stays yours.",
  "yield.clear": "clear",
  "yield.chain.all": "All chains",
  "yield.chain.solana": "Solana only",
  "yield.chain.cross": "Cross-chain only",
  "yield.liveNow": "Live now",
  "yield.stocksTitle": "Stocks · tokenized",
  "yield.goldTitle": "Commodities · gold",
  "yield.soonSolana": "On Solana · soon",
  "yield.soonCross": "Cross-chain · soon",
  "yield.noMatch": "No sources match these filters.",
  "yield.nfa.title": "Not financial advice",
  "yield.nfa.body": "Rates are current targets, not guarantees. You always sign every move.",

  // Pile
  "pile.title": "Everything you've got working",
  "pile.subtitle":
    "Your live positions across every source. Tap one to add more or withdraw — the money stays in your own hands.",
  "pile.total": "Total balance",
  "pile.positions": "Positions",
  "pile.empty.title": "You haven't deposited yet",
  "pile.empty.body": "Your positions show up here once you put money to work.",
  "pile.explore": "Explore yield",
  "pile.yourPosition": "your position",

  // Deposit / confirm / success
  "deposit.payWith": "pay with",
  "deposit.loadingAssets": "Loading your assets…",
  "deposit.noAssets": "No assets found in your wallet.",
  "deposit.payFromAnotherChain": "pay from another chain",
  "deposit.disconnect": "disconnect",
  "deposit.quoting": "quoting…",
  "deposit.youllHold": "you'll hold ≈ {value}",
  "deposit.swapCost": "swap cost ~{value}",
  "deposit.cantQuote": "couldn't quote — try a different amount",
  "deposit.applePayHint": "≈ {value} · apple pay or card · no crypto needed",
  "confirm.review": "review your {verb}",
  "confirm.youPay": "you pay",
  "confirm.youllHold": "you'll hold",
  "confirm.youllGet": "you'll get",
  "confirm.swapCostOneTime": "swap cost (one-time)",
  "confirm.route": "route",
  "confirm.route.instant": "instant",
  "confirm.route.swap": "swap · ~5s",
  "confirm.whereItGoes": "where it goes",
  "confirm.ownWallet": "your own wallet",
  "confirm.footer":
    "withdraw anytime · no lock · OXAR never holds your money — runs on USDC, digital dollars (1 USDC = $1). your wallet signs it.",
  "confirm.confirm": "confirm {verb}",
  "confirm.back": "back",
  "success.deposited": "Deposited",
  "success.withdrew": "Withdrew",
  "success.bridging": "Bridging",
  "success.bridgingBody":
    "bridging to Solana — we'll finish the deposit automatically. you can keep browsing.",
  "success.viewPosition": "view your position",
  "success.onSolscan": "on Solscan",
  "success.done": "Done",

  // Asset page
  "asset.apy": "apy",
  "asset.whatItIs": "what it is",
  "asset.yourPosition": "your position",
  "asset.sinceYouBought": "since you bought · on-chain p&l",
  "asset.marketValue": "current market value",
  "asset.principalYield": "what you put in + what it earned",
  "asset.apyLastDays": "apy · last {n} days",

  // Trust strip
  "trust.lentOn": "lent on",
  "trust.issuedBy": "issued by",
  "trust.deposited": "deposited",
  "trust.held": "held",
  "trust.withdrawAnytime": "withdraw anytime",
  "trust.sellAnytime": "sell anytime",
  "trust.noLock": "no lock-up",
  "trust.noFees": "no fees",
  "trust.selfCustody": "self-custody",

  // You / settings
  "you.title": "settings & profile",
  "you.account": "account",
  "you.email": "email",
  "you.wallet": "your wallet",
  "you.walletHint": "your money & positions live here",
  "you.signedOut": "you're signed out",
  "you.language": "language",
  "you.signOut": "sign out",

  // Risk labels
  "risk.low": "low risk",
  "risk.medium": "medium risk",
  "risk.high": "high risk",
} as const;

export type TranslationKey = keyof typeof en;
