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

  // Buy/sell rail
  "rail.buy": "buy",
  "rail.deposit": "deposit",
  "rail.sell": "sell",
  "rail.withdraw": "withdraw",
  "rail.verbBuy": "Buy",
  "rail.verbDeposit": "Deposit",
  "rail.nothingToSell": "nothing to sell yet",
  "rail.sellLabel": "Sell {sym}",
  "rail.withdrawLabel": "Withdraw {sym}",
  "rail.worth": "worth",
  "rail.available": "available",
  "rail.max": "max",
  "rail.actionSell": "Sell",
  "rail.actionWithdraw": "Withdraw",
  "rail.cashOut": "cash out to card",
  "common.soon": "soon",
  "common.or": "or",
  "common.copy": "Copy",
  "common.copied": "Copied",
  "deposit.afterSwap": " (after swap)",
  "confirm.route.bridge": "bridge",
  "confirm.route.fee": "fee",

  // Wallet menu
  "wallet.connecting": "connecting…",
  "wallet.send": "send",
  "wallet.exportKey": "export private key",
  "wallet.disconnect": "disconnect",

  // Busy statuses (tx in flight)
  "status.quoting": "Quoting…",
  "status.swapping": "Swapping…",
  "status.approving": "Approving…",
  "status.bridging": "Bridging…",
  "status.arriving": "Waiting for funds…",
  "status.depositing": "Depositing…",
  "status.working": "Working…",
  "status.funding": "Opening Apple Pay…",
  "status.buying": "Buying…",

  // Onboarding
  "onb.label": "how do you want to start?",
  "onb.title": "two ways in. same yield underneath.",
  "onb.subtitle": "pick whichever fits. you can always add the other later.",
  "onb.crypto.title": "i have crypto",
  "onb.crypto.body":
    "phantom, metamask, backpack, or sign in with email — privy gives you a solana wallet either way.",
  "onb.connect": "connect",
  "onb.phone.title": "just have a phone",
  "onb.phone.body":
    "apple pay or google pay — converted to digital dollars that land straight in your own wallet.",
  "onb.comingMvp": "coming with mvp",
  "onb.chip1": "non-custodial",
  "onb.chip2": "your keys, your money",
  "onb.chip3": "instant withdraw",
  "onb.chip4": "no bank required",

  // Login
  "login.back": "← back to home",
  "login.welcome": "[ welcome ]",
  "login.titleA": "where does your",
  "login.titleB": "money sleep?",
  "login.body": "wake it up. earn yield. own real assets. no bank, no broker, no lock.",
  "login.redirecting": "redirecting…",
  "login.continue": "continue",

  // Activity
  "activity.empty": "nothing yet — your money is still snoring.",

  // Cash-out sheet
  "cashout.label": "cash out · coming soon",
  "cashout.title": "Cash out to your card",
  "cashout.body1a": "Direct card payout is ",
  "cashout.body1b": "coming soon",
  "cashout.body1c":
    " — we're finishing the licensed off-ramp so you can sell straight to a Visa / Mastercard, in minutes.",
  "cashout.body2a":
    "In the meantime you can withdraw your dollars to any wallet or exchange you already use (Binance, Revolut, etc.) with ",
  "cashout.body2b": "Send",
  "cashout.body2c": ", and cash out from there — your funds, your keys, anytime.",
  "cashout.yourUsdc": "your USDC",
  "cashout.gotIt": "got it",

  // Send sheet
  "send.label": "Send / Withdraw",
  "send.title": "Take it anywhere",
  "send.sent": "Sent ✓",
  "send.youSend": "You send",
  "send.loading": "Loading…",
  "send.noAssets": "No assets to send.",
  "send.toChain": "To chain",
  "send.receive": "Receive",
  "send.toAddress": "To {chain} address",
  "send.addressPlaceholder": "Solana address",
  "send.errNoAssets": "No assets to send",
  "send.errAmount": "Enter an amount",
  "send.errAddress": "Enter a valid {chain} address",
  "send.notEnough": "Not enough {sym}",
  "send.arriving": "Arriving on {chain} shortly (~1 min)",
  "send.viewSolscan": "View on Solscan",
  "send.amount": "Amount",
  "send.sending": "Sending…",
  "send.action": "Send {asset} → {chain}",
  "deposit.youllDo": "you'll {verb} {value}",

  // User-facing errors (mapped from thrown messages)
  "err.priceImpact": "Price impact too high — try a smaller amount",
  "err.nothingToWithdraw": "Nothing to withdraw",
  "err.priceUnavailable": "Price unavailable — try again",
  "err.amountTooSmall": "Amount too small to withdraw",
  "err.walletNotConnected": "Wallet not connected",
  "err.tooSmallAfterGas": "That's too small after the gas reserve — try a bit more.",
  "err.fundsNotArrived":
    "We didn't see your funds arrive yet — card top-ups can take a few minutes. Once your SOL lands you can buy straight from your wallet balance.",
  "err.solPrice": "Couldn't price SOL — try again",
  "err.cancelled": "Cancelled — nothing left your wallet.",
  "err.expired": "That took too long and expired before it was sent. Please try again.",
  "err.insufficient": "Not enough balance — check you have enough USDC, plus a little SOL for the network fee.",
  "err.connectWallet": "Connect your wallet to continue.",
  "err.networkSlow": "Network's being slow right now. Please try again in a moment.",
} as const;

export type TranslationKey = keyof typeof en;
