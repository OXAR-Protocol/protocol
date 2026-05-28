import type { CrossChainSourceId, NavQuote } from "./types.js";
import { CROSS_CHAIN_SOURCES } from "./types.js";

/// Thin wrapper around Delora REST API.
///
/// Sprint 4 will fill in actual endpoint calls — for now stubs return
/// flat APY accrual based on the catalogue baseApy so downstream cron
/// can be tested end-to-end without hitting Delora.
export class DeloraClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly integrator: string,
  ) {}

  /// Fetch the current NAV for a cross-chain source.
  /// REAL implementation (Sprint 4):
  ///   1. GET /v1/positions?sourceId=… → returns underlying token balance held
  ///      by Delora settlement contract attributed to our vault PDA.
  ///   2. GET token price/value:
  ///      - USDY/USDM/TBILL: rebasing → balance × 1 USD (price ~$1, NAV is in
  ///        balance growth)
  ///      - sDAI: balance × DSR rate (chi from MakerDAO)
  ///      - sUSDe: balance × current vault share price from Ethena
  ///   3. Convert to NAV_PRECISION (1_000_000 = 1.0).
  ///
  /// STUB: linearly interpolate baseApy since lastNav timestamp.
  async fetchNav(
    sourceId: CrossChainSourceId,
    lastNav: bigint,
    secondsSinceLastUpdate: number,
  ): Promise<NavQuote> {
    const meta = CROSS_CHAIN_SOURCES[sourceId];
    const apyByToken: Record<string, number> = {
      USDY: 0.05,
      sUSDe: 0.11,
      sDAI: 0.065,
      USDM: 0.05,
      TBILL: 0.052,
    };
    const apy = apyByToken[meta.token] ?? 0;
    const yearFraction = secondsSinceLastUpdate / 31_536_000;
    const growth = BigInt(Math.floor(apy * yearFraction * 1_000_000));
    const newNav = lastNav + (lastNav * growth) / 1_000_000n;
    return { sourceId, navPerShare: newNav, asOf: Math.floor(Date.now() / 1000) };
  }
}
