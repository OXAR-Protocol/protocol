import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { OxarProtocol } from "../target/types/oxar_protocol";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { assert, expect } from "chai";

describe("oxar-protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OxarProtocol as Program<OxarProtocol>;
  const connection = provider.connection;

  // Test users — no admin gate now, anyone can create vaults
  const wallet = provider.wallet as anchor.Wallet;
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  const cranker = Keypair.generate();

  // Mints
  let usdcMint: PublicKey;

  // Alice's personal vault
  let aliceVaultPda: PublicKey;
  let aliceVaultTokenMint: PublicKey;
  let aliceUsdcPool: PublicKey;
  let aliceUsdc: PublicKey;
  let aliceVaultToken: PublicKey;

  // Seeds (mirror constants.rs)
  const VAULT_SEED = Buffer.from("vault");
  const MINT_SEED = Buffer.from("mint");
  const POOL_SEED = Buffer.from("pool");

  const INITIAL_NAV = 1_000_000;
  const NAV_PRECISION = 1_000_000;
  const USDC_DECIMALS = 6;
  const ONE_USDC = new BN(1_000_000);

  // Vault IDs
  const ALICE_VAULT_ID = new BN(1);

  /** Encode u64 as little-endian Buffer (8 bytes). */
  function u64LeBytes(value: BN): Buffer {
    return value.toArrayLike(Buffer, "le", 8);
  }

  /** Derive personal vault PDA: ["vault", creator, vault_id_le] */
  function derivePersonalVaultPda(
    creator: PublicKey,
    vaultId: BN
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [VAULT_SEED, creator.toBuffer(), u64LeBytes(vaultId)],
      program.programId
    );
  }

  function deriveMintPda(vault: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [MINT_SEED, vault.toBuffer()],
      program.programId
    );
  }

  function derivePoolPda(vault: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [POOL_SEED, vault.toBuffer()],
      program.programId
    );
  }

  before(async () => {
    // Airdrop SOL
    const airdrops = [
      connection.requestAirdrop(wallet.publicKey, 10 * LAMPORTS_PER_SOL),
      connection.requestAirdrop(alice.publicKey, 10 * LAMPORTS_PER_SOL),
      connection.requestAirdrop(bob.publicKey, 10 * LAMPORTS_PER_SOL),
      connection.requestAirdrop(cranker.publicKey, 5 * LAMPORTS_PER_SOL),
    ];
    const sigs = await Promise.all(airdrops);
    for (const sig of sigs) {
      await connection.confirmTransaction(sig);
    }

    // Create test USDC mint (wallet is the mint authority for test minting)
    usdcMint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      USDC_DECIMALS
    );

    // Pre-derive Alice's vault PDAs
    [aliceVaultPda] = derivePersonalVaultPda(alice.publicKey, ALICE_VAULT_ID);
    [aliceVaultTokenMint] = deriveMintPda(aliceVaultPda);
    [aliceUsdcPool] = derivePoolPda(aliceVaultPda);
  });

  // ==========================================================================
  // Personal vault — initialize, setup_pool, deposit, withdraw, crank_nav
  // ==========================================================================

  describe("Personal vault", () => {
    it("initializes a personal vault (no admin gate)", async () => {
      await program.methods
        .initializePersonalVault({
          vaultId: ALICE_VAULT_ID,
          riskTemplate: { conservative: {} } as any,
          adapterProgram: PublicKey.default,
          feeBps: 1000, // 10%
        } as any)
        .accounts({
          creator: alice.publicKey,
          vault: aliceVaultPda,
          usdcMint,
          vaultTokenMint: aliceVaultTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .signers([alice])
        .rpc();

      const vault = await (program.account as any).vault.fetch(aliceVaultPda);
      expect(vault.vaultId.toString()).to.equal(ALICE_VAULT_ID.toString());
      expect(vault.authority.toString()).to.equal(alice.publicKey.toString());
      expect(vault.navPerShare.toString()).to.equal(INITIAL_NAV.toString());
      expect(vault.totalShares.toString()).to.equal("0");
      expect(vault.isActive).to.equal(false);
      expect(vault.feeBps).to.equal(1000);
    });

    it("sets up the vault pool and activates the vault", async () => {
      await program.methods
        .setupVaultPool()
        .accounts({
          authority: alice.publicKey,
          vault: aliceVaultPda,
          usdcMint,
          usdcPool: aliceUsdcPool,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([alice])
        .rpc();

      const vault = await (program.account as any).vault.fetch(aliceVaultPda);
      expect(vault.isActive).to.equal(true);
      expect(vault.usdcPool.toString()).to.equal(aliceUsdcPool.toString());
    });

    it("rejects pool setup from non-authority", async () => {
      // Bob tries to setup pool on a fresh vault Alice owns
      const otherVaultId = new BN(99);
      const [otherVault] = derivePersonalVaultPda(
        alice.publicKey,
        otherVaultId
      );
      const [otherMint] = deriveMintPda(otherVault);
      const [otherPool] = derivePoolPda(otherVault);

      // First create the vault as Alice
      await program.methods
        .initializePersonalVault({
          vaultId: otherVaultId,
          riskTemplate: { balanced: {} } as any,
          adapterProgram: PublicKey.default,
          feeBps: 1000,
        } as any)
        .accounts({
          creator: alice.publicKey,
          vault: otherVault,
          usdcMint,
          vaultTokenMint: otherMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .signers([alice])
        .rpc();

      // Bob tries to setup pool — should fail (has_one = authority)
      try {
        await program.methods
          .setupVaultPool()
          .accounts({
            authority: bob.publicKey,
            vault: otherVault,
            usdcMint,
            usdcPool: otherPool,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([bob])
          .rpc();
        assert.fail("Expected unauthorized setup to fail");
      } catch (err: any) {
        expect(err.toString()).to.match(/has_one|authority|constraint/i);
      }
    });

    it("deposits USDC and mints shares at INITIAL_NAV", async () => {
      // Create alice's USDC ATA and fund it
      aliceUsdc = await createAccount(
        connection,
        wallet.payer,
        usdcMint,
        alice.publicKey
      );
      await mintTo(
        connection,
        wallet.payer,
        usdcMint,
        aliceUsdc,
        wallet.payer,
        100 * 1_000_000 // 100 USDC
      );

      // Create alice's vault token ATA
      aliceVaultToken = await createAccount(
        connection,
        wallet.payer,
        aliceVaultTokenMint,
        alice.publicKey
      );

      // Deposit 10 USDC
      const depositAmount = new BN(10_000_000);
      await program.methods
        .deposit(depositAmount)
        .accounts({
          depositor: alice.publicKey,
          vault: aliceVaultPda,
          vaultTokenMint: aliceVaultTokenMint,
          depositorUsdc: aliceUsdc,
          depositorVaultToken: aliceVaultToken,
          usdcPool: aliceUsdcPool,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .signers([alice])
        .rpc();

      const vault = await (program.account as any).vault.fetch(aliceVaultPda);
      // At INITIAL_NAV (1.0), 10 USDC → 10 shares (with 6 decimals)
      expect(vault.totalDeposits.toString()).to.equal("10000000");
      expect(vault.totalShares.toString()).to.equal("10000000");
      expect(vault.hotPoolBalance.toString()).to.equal("10000000");

      const tokenAccount = await getAccount(connection, aliceVaultToken);
      expect(tokenAccount.amount.toString()).to.equal("10000000");

      const poolAccount = await getAccount(connection, aliceUsdcPool);
      expect(poolAccount.amount.toString()).to.equal("10000000");
    });

    it("rejects zero deposits", async () => {
      try {
        await program.methods
          .deposit(new BN(0))
          .accounts({
            depositor: alice.publicKey,
            vault: aliceVaultPda,
            vaultTokenMint: aliceVaultTokenMint,
            depositorUsdc: aliceUsdc,
            depositorVaultToken: aliceVaultToken,
            usdcPool: aliceUsdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .signers([alice])
          .rpc();
        assert.fail("Expected zero deposit to fail");
      } catch (err: any) {
        expect(err.toString()).to.match(/ZeroDeposit/);
      }
    });

    it("cranks NAV (idle source = no-op)", async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // small delay
      const before = await (program.account as any).vault.fetch(aliceVaultPda);

      await program.methods
        .crankNav()
        .accounts({
          cranker: cranker.publicKey,
          vault: aliceVaultPda,
        } as any)
        .signers([cranker])
        .rpc();

      const after = await (program.account as any).vault.fetch(aliceVaultPda);
      // Idle source: NAV stays the same, only last_update_ts changes
      expect(after.navPerShare.toString()).to.equal(
        before.navPerShare.toString()
      );
      expect(after.lastUpdateTs.toNumber()).to.be.greaterThan(
        before.lastUpdateTs.toNumber()
      );
    });

    it("withdraws by burning shares", async () => {
      const withdrawShares = new BN(5_000_000); // half of position
      const usdcBefore = await getAccount(connection, aliceUsdc);

      await program.methods
        .withdraw(withdrawShares)
        .accounts({
          withdrawer: alice.publicKey,
          vault: aliceVaultPda,
          vaultTokenMint: aliceVaultTokenMint,
          withdrawerVaultToken: aliceVaultToken,
          withdrawerUsdc: aliceUsdc,
          usdcPool: aliceUsdcPool,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .signers([alice])
        .rpc();

      const vault = await (program.account as any).vault.fetch(aliceVaultPda);
      expect(vault.totalShares.toString()).to.equal("5000000");
      expect(vault.hotPoolBalance.toString()).to.equal("5000000");

      const tokenAccount = await getAccount(connection, aliceVaultToken);
      expect(tokenAccount.amount.toString()).to.equal("5000000");

      // At NAV=1.0, withdrawing 5M shares = 5M USDC
      const usdcAfter = await getAccount(connection, aliceUsdc);
      const delta = Number(usdcAfter.amount) - Number(usdcBefore.amount);
      expect(delta).to.equal(5_000_000);
    });

    it("rejects withdraw exceeding share balance", async () => {
      try {
        await program.methods
          .withdraw(new BN(999_999_999)) // way more than alice owns
          .accounts({
            withdrawer: alice.publicKey,
            vault: aliceVaultPda,
            vaultTokenMint: aliceVaultTokenMint,
            withdrawerVaultToken: aliceVaultToken,
            withdrawerUsdc: aliceUsdc,
            usdcPool: aliceUsdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .signers([alice])
          .rpc();
        assert.fail("Expected over-withdraw to fail");
      } catch (err: any) {
        expect(err.toString()).to.match(/InsufficientShares/);
      }
    });

    it("rejects zero withdrawal", async () => {
      try {
        await program.methods
          .withdraw(new BN(0))
          .accounts({
            withdrawer: alice.publicKey,
            vault: aliceVaultPda,
            vaultTokenMint: aliceVaultTokenMint,
            withdrawerVaultToken: aliceVaultToken,
            withdrawerUsdc: aliceUsdc,
            usdcPool: aliceUsdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .signers([alice])
          .rpc();
        assert.fail("Expected zero withdraw to fail");
      } catch (err: any) {
        expect(err.toString()).to.match(/ZeroWithdrawal/);
      }
    });
  });

  // ==========================================================================
  // Multiple users can create independent vaults
  // ==========================================================================

  describe("Multi-user", () => {
    it("Bob can create his own vault (no admin gate)", async () => {
      const bobVaultId = new BN(1);
      const [bobVault] = derivePersonalVaultPda(bob.publicKey, bobVaultId);
      const [bobMint] = deriveMintPda(bobVault);

      await program.methods
        .initializePersonalVault({
          vaultId: bobVaultId,
          riskTemplate: { aggressive: {} } as any,
          adapterProgram: PublicKey.default,
          feeBps: 1500,
        } as any)
        .accounts({
          creator: bob.publicKey,
          vault: bobVault,
          usdcMint,
          vaultTokenMint: bobMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .signers([bob])
        .rpc();

      const vault = await (program.account as any).vault.fetch(bobVault);
      expect(vault.authority.toString()).to.equal(bob.publicKey.toString());
      expect(vault.feeBps).to.equal(1500);
    });
  });

  // ==========================================================================
  // Yield routing — Idle path bookkeeping
  // ==========================================================================

  describe("Yield routing — Idle path", () => {
    it("route_yield_deposit moves balance from hot to cold (Idle vault)", async () => {
      // Alice's vault has adapter_program = PublicKey.default (Idle).
      // After the earlier deposit + partial withdraw, hot_pool_balance = 5_000_000.
      const routeAmount = new BN(1_000_000); // route 1 USDC

      const before = await (program.account as any).vault.fetch(aliceVaultPda);
      const hotBefore = before.hotPoolBalance.toNumber();
      const coldBefore = before.coldCapital.toNumber();

      await program.methods
        .routeYieldDeposit(routeAmount)
        .accounts({
          signer: alice.publicKey,
          vault: aliceVaultPda,
          // Idle path — adapter accounts are Option::None; pass null so
          // Anchor fills them with programId (the convention for optional accounts)
          registry: null,
          adapterEntry: null,
          adapterProgram: null,
          vaultUsdcPool: null,
          adapterState: null,
          instructionsSysvar: null,
        } as any)
        .signers([alice])
        .rpc();

      const after = await (program.account as any).vault.fetch(aliceVaultPda);
      expect(after.hotPoolBalance.toNumber()).to.equal(
        hotBefore - routeAmount.toNumber()
      );
      expect(after.coldCapital.toNumber()).to.equal(
        coldBefore + routeAmount.toNumber()
      );
    });

    it("route_yield_deposit rejects zero amount", async () => {
      try {
        await program.methods
          .routeYieldDeposit(new BN(0))
          .accounts({
            signer: alice.publicKey,
            vault: aliceVaultPda,
            registry: null,
            adapterEntry: null,
            adapterProgram: null,
            vaultUsdcPool: null,
            adapterState: null,
            instructionsSysvar: null,
          } as any)
          .signers([alice])
          .rpc();
        assert.fail("Expected ZeroDeposit to fail");
      } catch (err: any) {
        expect(err.toString()).to.match(/ZeroDeposit/);
      }
    });

    it("route_yield_deposit rejects amount exceeding hot_pool_balance", async () => {
      try {
        await program.methods
          .routeYieldDeposit(new BN(999_999_999))
          .accounts({
            signer: alice.publicKey,
            vault: aliceVaultPda,
            registry: null,
            adapterEntry: null,
            adapterProgram: null,
            vaultUsdcPool: null,
            adapterState: null,
            instructionsSysvar: null,
          } as any)
          .signers([alice])
          .rpc();
        assert.fail("Expected InsufficientFunds to fail");
      } catch (err: any) {
        expect(err.toString()).to.match(/InsufficientFunds/);
      }
    });
  });

  // ==========================================================================
  // Adapter path (non-Idle) — adapter accounts missing → NotImplemented
  // Updated in Task 5: non-Idle vaults without adapter accounts return NotImplemented
  // (adapter_entry is Option::None → unpacking fails).
  // A real whitelisted adapter would proceed to CPI; tested in fork suite.
  // ==========================================================================

  describe("Adapter path (non-Idle) — missing adapter accounts", () => {
    it("route_yield_deposit returns NotImplemented when adapter accounts omitted", async () => {
      const fakeAdapter = Keypair.generate().publicKey;
      // Use Date.now() to avoid PDA collision across test runs on the same validator
      const vaultId = new BN(Date.now());
      const [vaultPda] = derivePersonalVaultPda(wallet.publicKey, vaultId);
      const [vaultTokenMint] = deriveMintPda(vaultPda);
      const [usdcPool] = derivePoolPda(vaultPda);

      await program.methods
        .initializePersonalVault({
          vaultId,
          riskTemplate: { balanced: {} } as any,
          adapterProgram: fakeAdapter,
          feeBps: 1000,
        } as any)
        .accounts({
          creator: wallet.publicKey,
          vault: vaultPda,
          usdcMint,
          vaultTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .rpc();

      await program.methods
        .setupVaultPool()
        .accounts({
          authority: wallet.publicKey,
          vault: vaultPda,
          usdcMint,
          usdcPool,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      // Fund the vault
      const walletUsdc = await createAccount(
        connection,
        wallet.payer,
        usdcMint,
        wallet.publicKey
      );
      await mintTo(
        connection,
        wallet.payer,
        usdcMint,
        walletUsdc,
        wallet.payer,
        10_000_000
      );
      const walletVaultToken = await createAccount(
        connection,
        wallet.payer,
        vaultTokenMint,
        wallet.publicKey
      );
      await program.methods
        .deposit(new BN(5_000_000))
        .accounts({
          depositor: wallet.publicKey,
          vault: vaultPda,
          vaultTokenMint,
          depositorUsdc: walletUsdc,
          depositorVaultToken: walletVaultToken,
          usdcPool,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

      // Adapter branch with no adapter accounts → NotImplemented (Option::None unpack).
      // Pass null for all optional accounts so Anchor doesn't reject client-side.
      try {
        await program.methods
          .routeYieldDeposit(new BN(1_000_000))
          .accounts({
            vault: vaultPda,
            signer: wallet.publicKey,
            registry: null,
            adapterEntry: null,
            adapterProgram: null,
            vaultUsdcPool: null,
            adapterState: null,
            instructionsSysvar: null,
          } as any)
          .rpc();
        throw new Error("Expected NotImplemented to fail");
      } catch (err: any) {
        expect(err.toString()).to.match(/NotImplemented/);
      }
    });
  });

});
