import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

/**
 * Smoke test that proves the mainnet-fork validator is alive and the
 * always-clone account (mainnet USDC mint) is reachable locally.
 *
 * Run via `anchor test --skip-deploy --skip-build -- --grep "fork sanity"`
 * or `yarn workspace contracts test-fork`.
 *
 * If this test fails, every Sprint 1+ adapter test will also fail —
 * usually means the validator failed to clone, or RPC mainnet endpoint
 * is rate-limited. Solutions:
 *   - Wait 30s and retry
 *   - Switch `url` in Anchor.toml to a Helius mainnet RPC
 *   - Run `solana-test-validator --reset --clone ...` manually first
 */

const USDC_MAINNET = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);

describe("fork sanity", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection: Connection = provider.connection;

  it("clones mainnet USDC mint into local fork", async () => {
    const info = await connection.getAccountInfo(USDC_MAINNET);
    expect(info, "USDC mint not found in fork — clone failed").to.not.be.null;
    expect(info!.owner.toBase58()).to.equal(
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    );
    expect(info!.data.length).to.equal(82); // SPL mint layout
  });

  it("local validator reports a slot > 0", async () => {
    const slot = await connection.getSlot();
    expect(slot).to.be.greaterThan(0);
  });
});
