/**
 * Fork test: dispatcher Idle path after Task 5 refactor.
 *
 * STATUS: STUBBED — requires a mainnet-fork validator with cloned accounts.
 * Run via: anchor test -- --grep fork
 *
 * Full implementation requires:
 * 1. Anchor.toml [test.validator] cloning USDC mint from mainnet
 * 2. A funded wallet with test USDC
 * 3. An Idle personal vault (adapter_program = PublicKey.default)
 *    created and funded on the local fork
 *
 * The test verifies that after the Task 5 CPI dispatcher refactor, the Idle
 * path (no external routing, bookkeeping only) still works correctly:
 * - hotPoolBalance decreases by `amount`
 * - coldCapital increases by `amount`
 * - No CPI is issued (adapter accounts are Option::None)
 */

import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("fork · dispatcher Idle path (adapter_program = PublicKey.default)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.OxarProtocol;

  // Mainnet USDC mint — cloned into localnet by Anchor.toml fork config
  const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

  it.skip(
    "Idle vault bookkeeping route still works after dispatcher refactor",
    async () => {
      // TODO (Task 5 fork test):
      // 1. Derive personal vault PDA for provider.wallet, vault_id = 1
      // 2. Call initialize_personal_vault with adapter_program = PublicKey.default
      // 3. Call setup_vault_pool
      // 4. Create USDC ATA for wallet, fund via mint authority (requires cloned mint authority)
      //    OR use a pre-funded test account cloned from mainnet snapshot
      // 5. Deposit 10 USDC → verify hot_pool_balance = 10_000_000
      // 6. Call route_yield_deposit(5_000_000) with only signer + vault accounts
      //    (adapter accounts omitted → Option::None → Idle path)
      // 7. Assert:
      //    vault.hot_pool_balance == 5_000_000 (decreased by 5)
      //    vault.cold_capital    == 5_000_000 (increased by 5)
      //
      // Mirror pattern from existing localnet test in oxar-protocol.ts §"Idle path"
      // but run against a fork that includes real mainnet USDC mint state.

      void usdcMint; // suppress unused warning until stub is implemented
      expect(true).to.equal(true); // placeholder assertion
    }
  );
});
