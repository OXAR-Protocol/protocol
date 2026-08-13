import { describe, it, expect } from "vitest";

import { SOL_MINT } from "@oxar/sdk";

import {
  outboundKind,
  getDestChain,
  canLeaveSolana,
  destChainsFor,
  DEST_CHAINS,
} from "./outbound-destinations";
import { USDC_MINT } from "@/lib/constants";

const solana = getDestChain("solana");
const base = getDestChain("base");

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDG = "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH";

describe("outboundKind", () => {
  it("bridges for any EVM destination, regardless of source", () => {
    expect(outboundKind(USDG, base, base.assets[0].mint)).toBe("bridge");
    expect(outboundKind(USDC, base, base.assets[1].mint)).toBe("bridge");
  });
  it("transfers same Solana asset", () => {
    expect(outboundKind(USDC, solana, USDC)).toBe("transfer");
  });
  it("swaps a different Solana asset (e.g. USDG → USDC, or → SOL)", () => {
    expect(outboundKind(USDG, solana, USDC)).toBe("swap");
    expect(outboundKind(USDG, solana, solana.assets[1].mint)).toBe("swap");
  });
});

const ORO = "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A";

/**
 * The send flow offers networks BEFORE it quotes anything, so the list has to be a
 * promise it can keep. Money crosses; a tokenized share, gold or a yield receipt has
 * no market on the other side, and offering Base for one of those means failing at
 * the quote three screens in.
 */
describe("destChainsFor", () => {
  it("lets money cross", () => {
    expect(canLeaveSolana(USDC_MINT)).toBe(true);
    expect(canLeaveSolana(SOL_MINT)).toBe(true);
    expect(destChainsFor(USDC_MINT)).toHaveLength(DEST_CHAINS.length);
  });

  it("keeps everything else on Solana", () => {
    expect(canLeaveSolana(ORO)).toBe(false);
    const chains = destChainsFor(ORO);
    expect(chains).toHaveLength(1);
    expect(chains[0]!.chain).toBe("solana");
  });

  it("always offers Solana, whatever is being sent", () => {
    for (const mint of [USDC_MINT, SOL_MINT, ORO]) {
      expect(destChainsFor(mint).some((d) => d.chain === "solana")).toBe(true);
    }
  });
});
