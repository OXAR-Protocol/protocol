// Mainnet-fork end-to-end test for the kamino-usdc adapter, on bankrun.
//
// Clones the real klend USDC-reserve account set from mainnet, sets the clock at
// the reserve's cached slot (so klend's `clock.slot - last_update` math doesn't
// underflow on a fork), then drives the full dispatcher flow:
//   initialize_registry → whitelist_adapter → open_position → deposit →
//   current_value → withdraw
// and asserts the USDC round-trips back through real Kamino CPIs.
import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  ComputeBudgetProgram,
  Keypair,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  AccountLayout,
} from "@solana/spl-token";
import { startAnchor, Clock, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { expect } from "chai";

import { KAMINO, USDC_MINT, RESERVE_LAST_UPDATE_SLOT_OFFSET } from "./kamino-addresses";
import { cloneFromMainnet, usdcTokenAccount } from "./fork-utils";

const dispatcherIdl = require("../../target/idl/dispatcher.json");
const kaminoIdl = require("../../target/idl/kamino_usdc.json");

const DEPOSIT = 100_000_000n; // 100 USDC
const FUND = 1_000_000_000n; // 1,000 USDC

const ro = (pubkey: PublicKey) => ({ pubkey, isSigner: false, isWritable: false });
const rw = (pubkey: PublicKey) => ({ pubkey, isSigner: false, isWritable: true });

describe("kamino-usdc · mainnet-fork e2e", () => {
  let ctx: ProgramTestContext;
  let provider: BankrunProvider;
  let dispatcher: anchor.Program;
  let kamino: anchor.Program;
  let owner: Keypair;

  // PDAs
  let registry: PublicKey, adapterEntry: PublicKey, position: PublicKey, adapterState: PublicKey;
  let positionPool: PublicKey, collateralVault: PublicKey, ownerUsdcAta: PublicKey;

  before(async () => {
    const cloned = await cloneFromMainnet([
      USDC_MINT,
      KAMINO.klendProgram,
      KAMINO.klendProgramData,
      KAMINO.reserve,
      KAMINO.lendingMarket,
      KAMINO.liquiditySupplyVault,
      KAMINO.collateralMint,
      KAMINO.collateralSupplyVault,
      KAMINO.scopePrices,
    ]);

    // klend is a heavy program; give transactions a high CU ceiling.
    ctx = await startAnchor("", [], cloned, 10_000_000n);
    provider = new BankrunProvider(ctx);
    anchor.setProvider(provider);
    dispatcher = new anchor.Program(dispatcherIdl, provider);
    kamino = new anchor.Program(kaminoIdl, provider);
    owner = ctx.payer;

    // Set the clock at/after the reserve's cached slot so refresh_reserve is sane.
    const reserveData = cloned.find((a) => a.address.equals(KAMINO.reserve))!.info.data;
    const reserveSlot = reserveData.readBigUInt64LE(RESERVE_LAST_UPDATE_SLOT_OFFSET);
    const clock = await ctx.banksClient.getClock();
    ctx.setClock(
      new Clock(reserveSlot + 2n, clock.epochStartTimestamp, clock.epoch, clock.leaderScheduleEpoch, clock.unixTimestamp),
    );

    // Fund the owner with USDC (can't mint — inject a pre-built token account).
    ownerUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, owner.publicKey);
    ctx.setAccount(ownerUsdcAta, usdcTokenAccount(USDC_MINT, owner.publicKey, FUND));

    const kid = kamino.programId;
    [registry] = PublicKey.findProgramAddressSync([Buffer.from("registry")], dispatcher.programId);
    [adapterEntry] = PublicKey.findProgramAddressSync([Buffer.from("adapter_entry"), kid.toBuffer()], dispatcher.programId);
    [position] = PublicKey.findProgramAddressSync([Buffer.from("position"), owner.publicKey.toBuffer(), kid.toBuffer()], dispatcher.programId);
    [adapterState] = PublicKey.findProgramAddressSync([Buffer.from("adapter_state"), kid.toBuffer(), position.toBuffer()], kid);
    positionPool = getAssociatedTokenAddressSync(USDC_MINT, position, true);
    collateralVault = getAssociatedTokenAddressSync(KAMINO.collateralMint, position, true);
  });

  // Process an instruction list through banksClient, surfacing logs on failure.
  async function send(ixs: anchor.web3.TransactionInstruction[], extra: Keypair[] = []) {
    const build = () => {
      const tx = new Transaction();
      tx.feePayer = owner.publicKey;
      tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }), ...ixs);
      return tx;
    };
    const tx = build();
    const [bh] = await ctx.banksClient.getLatestBlockhash();
    tx.recentBlockhash = bh;
    tx.sign(owner, ...extra);
    try {
      const meta = await ctx.banksClient.tryProcessTransaction(tx);
      if (meta.result) {
        const sim = build();
        sim.recentBlockhash = bh;
        sim.sign(owner, ...extra);
        const s = await ctx.banksClient.simulateTransaction(sim);
        console.error((s.meta?.logMessages ?? []).join("\n"));
        throw new Error(`tx failed: ${meta.result}`);
      }
      return meta.meta!;
    } catch (e) {
      const sim = build();
      sim.recentBlockhash = bh;
      sim.sign(owner, ...extra);
      const s = await ctx.banksClient.simulateTransaction(sim).catch(() => null);
      if (s) console.error((s.meta?.logMessages ?? []).join("\n"));
      throw e;
    }
  }

  const tokenBalance = async (ata: PublicKey): Promise<bigint> => {
    const acc = await ctx.banksClient.getAccount(ata);
    if (!acc) return 0n;
    return AccountLayout.decode(Buffer.from(acc.data)).amount;
  };

  it("initializes the registry and whitelists the kamino adapter", async () => {
    await send([
      await dispatcher.methods.initializeRegistry().accountsStrict({
        admin: owner.publicKey,
        registry,
        systemProgram: SystemProgram.programId,
      }).instruction(),
    ]);
    await send([
      await dispatcher.methods.whitelistAdapter("Kamino USDC", 1).accountsStrict({
        admin: owner.publicKey,
        registry,
        adapterEntry,
        adapterProgram: kamino.programId,
        systemProgram: SystemProgram.programId,
      }).instruction(),
    ]);
    const entry = await (dispatcher.account as any).adapterEntry.fetch(adapterEntry);
    expect(entry.isActive).to.equal(true);
    expect(entry.name).to.equal("Kamino USDC");
  });

  it("opens a position (creates pool + adapter state via CPI)", async () => {
    await send([
      await dispatcher.methods.openPosition().accountsStrict({
        owner: owner.publicKey,
        adapterEntry,
        adapterProgram: kamino.programId,
        position,
        usdcMint: USDC_MINT,
        positionUsdcPool: positionPool,
        adapterState,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      }).remainingAccounts([
        ro(KAMINO.reserve),
        ro(KAMINO.collateralMint),
        rw(collateralVault),
        ro(TOKEN_PROGRAM_ID),
        ro(ASSOCIATED_TOKEN_PROGRAM_ID),
      ]).instruction(),
    ]);
    const st = await (kamino.account as any).adapterState.fetch(adapterState);
    expect(st.header.totalShares.toString()).to.equal("0");
    expect(st.kaminoReserve.toBase58()).to.equal(KAMINO.reserve.toBase58());
  });

  // Built lazily: collateralVault is only known after `before()` runs.
  const depositRemaining = () => [
    rw(KAMINO.reserve),
    ro(KAMINO.lendingMarket),
    ro(KAMINO.lendingMarketAuthority),
    ro(USDC_MINT),
    rw(KAMINO.liquiditySupplyVault),
    rw(KAMINO.collateralMint),
    rw(collateralVault),
    ro(TOKEN_PROGRAM_ID),
    ro(TOKEN_PROGRAM_ID),
    ro(KAMINO.scopePrices),
    ro(KAMINO.klendProgram),
  ];

  it("deposits 100 USDC into Kamino via the dispatcher", async () => {
    const before = await tokenBalance(ownerUsdcAta);
    await send([
      await dispatcher.methods.deposit(new anchor.BN(DEPOSIT.toString())).accountsStrict({
        owner: owner.publicKey,
        adapterEntry,
        adapterProgram: kamino.programId,
        position,
        positionUsdcPool: positionPool,
        ownerUsdcAta,
        adapterState,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).remainingAccounts(depositRemaining()).instruction(),
    ]);
    const after = await tokenBalance(ownerUsdcAta);
    expect(before - after).to.equal(DEPOSIT);
    const st = await (kamino.account as any).adapterState.fetch(adapterState);
    expect(BigInt(st.header.totalShares.toString())).to.be.greaterThan(0n);
    expect(await tokenBalance(positionPool)).to.equal(0n); // all routed into klend
  });

  it("reports a current value ≈ the deposit (read via return data)", async () => {
    const meta = await send([
      await dispatcher.methods.currentValue().accountsStrict({
        adapterEntry,
        adapterProgram: kamino.programId,
        position,
        adapterState,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      }).remainingAccounts([
        rw(KAMINO.reserve),
        ro(KAMINO.lendingMarket),
        ro(KAMINO.scopePrices),
        ro(KAMINO.klendProgram),
      ]).instruction(),
    ]);
    const rd = meta.returnData;
    expect(rd, "no return data from current_value").to.not.be.null;
    const value = Buffer.from(rd!.data).readBigUInt64LE(0);
    // klend rounds collateral→liquidity down; value is within a dust of the deposit.
    expect(value).to.be.greaterThan(DEPOSIT - 1_000_000n);
    expect(value).to.be.lessThan(DEPOSIT + 1_000_000n);
  });

  it("withdraws all shares back to USDC", async () => {
    const st = await (kamino.account as any).adapterState.fetch(adapterState);
    const shares = new anchor.BN(st.header.totalShares.toString());
    const before = await tokenBalance(ownerUsdcAta);
    await send([
      await dispatcher.methods.withdraw(shares).accountsStrict({
        owner: owner.publicKey,
        adapterEntry,
        adapterProgram: kamino.programId,
        position,
        positionUsdcPool: positionPool,
        ownerUsdcAta,
        adapterState,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).remainingAccounts(depositRemaining()).instruction(),
    ]);
    const after = await tokenBalance(ownerUsdcAta);
    expect(after - before).to.be.greaterThan(DEPOSIT - 1_000_000n); // ~100 USDC back
    const stAfter = await (kamino.account as any).adapterState.fetch(adapterState);
    expect(stAfter.header.totalShares.toString()).to.equal("0");
  });
});
