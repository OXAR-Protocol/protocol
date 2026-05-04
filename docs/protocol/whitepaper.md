# OXAR Protocol — Whitepaper v0.1

**Emerging market yields, onchain.**

April 2026

---

## Abstract

OXAR is a decentralized protocol on Solana for tokenizing sovereign debt from emerging markets. It enables crypto investors to access government-guaranteed yields of 16-28% APY through USDC deposits, receiving yield-bearing SPL tokens composable with Solana DeFi.

The tokenized RWA market surpassed $21B in early 2026, but virtually all sovereign debt on-chain is US Treasuries at 4% yields. OXAR fills the empty "Non-US Government Debt" category — bringing emerging market bonds to crypto for the first time.

---

## 1. Market Opportunity

### 1.1 The Yield Gap

| Market | Instrument | Yield | On-chain Access |
|--------|-----------|-------|-----------------|
| United States | T-Bills | 4-5% | Ondo, BlackRock BUIDL, etc. |
| Ukraine | OVDP | 16-18% | None |
| Turkey | Govt bonds | 25-30% | None |
| Brazil | Treasury | 12-14% | None |
| Poland | Treasury | 5-6% | None |

$230B+ sits in stablecoins earning nothing. Ondo proved demand by offering 4% and attracting $2.5B TVL. Higher yields from emerging markets will attract proportionally more capital.

### 1.2 Market Size

- Tokenized RWA total: $21B TVL, projected $100B by end of 2026
- Non-US government debt on-chain: virtually zero
- Ukrainian OVDP market: ~$46B outstanding, non-residents hold 0.8%
- Global emerging market sovereign debt: $3.4T+

### 1.3 Competitive Landscape

| Protocol | Assets | Yield | Our Advantage |
|----------|--------|-------|---------------|
| Ondo Finance | US Treasuries, stocks | 4-5% | We offer 4x higher yields |
| BlackRock BUIDL | US Treasuries | ~4% | Same |
| Goldfinch | Private credit (EM) | 10-17% | We have govt guarantee, they don't |
| UACB (dead) | Ukrainian bonds | 15% | One-time issuance in 2022, project dead |
| UAHe | UAH stablecoin | ~19% | Stablecoin, not investment platform |

OXAR is the only protocol offering government-guaranteed emerging market yields on-chain.

---

## 2. Protocol Design

### 2.1 Vault Architecture

Each vault represents a specific country + currency + bond type combination.

```
Vault {
    country:          "UA"         // ISO country code
    currency:         "UAH"        // Bond denomination
    bond_type:        "OVDP"       // Instrument type
    apy_bps:          1800         // 18.00% in basis points
    maturity_ts:      1756684800   // Bond maturity (unix)
    nav_per_share:    1_042_000    // $1.042 per token (6 decimals)
    total_deposits:   500_000_00   // $500K USDC deposited
    total_shares:     480_000_00   // 480K vault tokens outstanding
    is_active:        true
}
```

### 2.2 User Flow

1. User authenticates via Privy (email, social login, or existing wallet)
2. User selects vault from dashboard (sees country, APY, risk level)
3. User deposits USDC amount
4. Protocol mints vault tokens (oxUA-UAH, oxUA-USD, etc.) based on current NAV
5. NAV increases daily reflecting bond yield accrual
6. For non-USD vaults, NAV also adjusts for FX rate changes
7. User can withdraw (burn tokens → receive USDC at current NAV)
8. User can also trade vault tokens on any Solana DEX

### 2.3 NAV Calculation

```
nav_per_share = (total_bond_value_usd + accrued_yield_usd) / total_shares
```

For foreign-currency bonds:
```
bond_value_usd = bond_value_local / fx_rate
effective_yield_usd = nominal_yield - fx_depreciation
```

Example for Ukraine UAH vault:
- Nominal yield: 18%
- UAH depreciation: ~8% per year
- Effective yield in USD: ~10%
- Still 2.5x higher than US Treasuries

### 2.4 Token Standard

All vault tokens are standard SPL tokens on Solana:
- Fully fungible and transferable
- Tradeable on any Solana DEX (Raydium, Jupiter, etc.)
- Usable as collateral in lending protocols
- 6 decimal places (matching USDC)

### 2.5 Oracle Requirements

| Data Feed | Source | Update Frequency |
|-----------|--------|-----------------|
| Bond yields | Ministry of Finance APIs | Weekly (after auctions) |
| FX rates (UAH/USD etc.) | Pyth / Switchboard | Real-time |
| Proof of Reserves | Custodian attestation | Daily |

---

## 3. Risk Framework

### 3.1 Risk Categories

| Risk | Description | Mitigation |
|------|-------------|------------|
| Sovereign default | Country fails to pay bonds | Multi-country diversification; USD-denominated bonds available |
| Currency depreciation | Local currency falls vs USD | FX-adjusted NAV shown; USD bond vaults as alternative |
| Custodian risk | Broker holding bonds fails | Licensed regulated brokers; Proof of Reserves on-chain |
| Smart contract risk | Bug in protocol code | Open source; future audit; standard Anchor patterns |
| Liquidity risk | Can't exit position | DEX trading 24/7; protocol redemption mechanism |
| Regulatory risk | Rules change | SPV structure; compliance-first approach |

### 3.2 Risk Scoring

Each vault displays a simple risk score:

- 🟢 **Low** — USD-denominated government bonds (US, Ukraine USD)
- 🟡 **Medium** — Stable EM currencies (Poland PLN, Brazil BRL)
- 🔴 **High** — Volatile EM currencies (Ukraine UAH, Turkey TRY)

Users always see effective USD yield after FX adjustment, not just nominal local yield.

---

## 4. Business Model

### 4.1 Revenue Streams

| Stream | Rate | Example on $10M TVL |
|--------|------|-------------------|
| Yield spread | 0.5-1% of yield | $50K-100K/year |
| Mint fee | 0.15% | $15K per $10M deposited |
| Redeem fee | 0.15% | $15K per $10M withdrawn |
| DEX LP fees | 0.1% of volume | Variable |

### 4.2 Scaling Economics

At $100M TVL with blended 12% average yield across vaults and 0.75% spread:
- Annual protocol revenue: ~$750K from spread alone
- Plus transaction fees: ~$300K estimated
- Total: ~$1M+ ARR

---

## 5. Roadmap

### Phase 1: MVP (Q2 2026)
- Solana smart contracts (Anchor)
- Ukrainian OVDP vaults (UAH + USD denominated)
- Frontend with Privy authentication, deposit/withdraw
- Simulated oracle with real government bond data
- Hackathon submission

### Phase 2: Real Assets (Q3 2026)
- Partnership with licensed Ukrainian broker (ICU Trade or Dragon Capital)
- Proof of Reserves oracle integration (Chainlink PoR or custom)
- KYC module for regulated vault access
- US Treasury vault for yield comparison baseline

### Phase 3: Multi-Country (Q4 2026)
- Turkish government bonds vault
- Polish treasury bonds vault
- Brazilian sovereign debt vault
- Yield comparison engine across all vaults

### Phase 4: DeFi Composability (2027)
- Vault tokens accepted as collateral in Solana lending (Kamino, MarginFi)
- AMM liquidity pools for vault token / USDC pairs
- Auto-rebalancing portfolio vault (spread across countries)
- Governance token launch
- SDK for other protocols to integrate OXAR vaults
- B2G: white-label solution for sovereign debt offices

---

## 6. Legal Structure

OXAR vault tokens are receipt tokens representing a claim on underlying government bonds held by licensed, regulated custodians through a Special Purpose Vehicle (SPV).

The SPV:
- Is a separate legal entity holding bonds on behalf of token holders
- Is bankruptcy-remote from the protocol team
- Is subject to regular third-party audits
- Publishes Proof of Reserves on-chain

Regulatory compliance varies by jurisdiction. Vault access may be restricted based on investor location and applicable securities laws.

---

## 7. Why Solana

- Transaction cost: <$0.01 (critical for frequent NAV updates and small deposits)
- Speed: 400ms finality (real-time portfolio updates)
- RWA ecosystem: $873M in tokenized assets, fastest-growing chain for RWA
- DeFi composability: Jupiter, Raydium, Kamino, MarginFi — instant integrations
- Compressed NFTs / Token Extensions for future features

---

## 8. Why Now

1. RWA is the fastest-growing crypto sector (300% YoY)
2. Solana has become the preferred RWA chain
3. Ondo proved the model but doesn't touch emerging markets
4. Non-US govt debt on-chain is an empty category
5. Emerging market yields are at multi-year highs
6. Ukraine has digital infrastructure (Diia) and legalized digital assets
7. Regulatory clarity improving globally (MiCA, SEC stance softening)

---

*OXAR Protocol — Emerging market yields, onchain.*
