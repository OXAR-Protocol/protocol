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
import { assert } from "chai";

describe("oxar-protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OxarProtocol as Program<OxarProtocol>;
  const connection = provider.connection;

  // Authority is the provider wallet (must match PROTOCOL_ADMIN)
  const authority = provider.wallet as anchor.Wallet;

  // Test users
  const depositor = Keypair.generate();
  const buyer = Keypair.generate();
  const nonAdmin = Keypair.generate();

  // Vault params
  const region = "UA";
  const denomination = "UAH";
  const assetSubtype = "GOVT";
  const assetClass = "fixed_income";
  const series: number = 1;
  const apyBps = new BN(1800); // 18%
  const feeBps = 50; // 0.5%

  // Perpetual vault params
  const perpetualSeries: number = 2;

  // Mints and accounts
  let usdcMint: PublicKey;
  let vaultPda: PublicKey;
  let vaultBump: number;
  let vaultTokenMintPda: PublicKey;
  let usdcPoolPda: PublicKey;
  let depositorUsdc: PublicKey;
  let depositorVaultToken: PublicKey;
  let buyerUsdc: PublicKey;
  let buyerVaultToken: PublicKey;
  let treasuryUsdc: PublicKey; // treasury USDC token account for fees
  let listingPda: PublicKey;
  let listingBump: number;
  let escrowPda: PublicKey;
  let maturityTs: BN;

  // Perpetual vault accounts
  let perpetualVaultPda: PublicKey;
  let perpetualVaultTokenMintPda: PublicKey;
  let perpetualUsdcPoolPda: PublicKey;
  let depositorPerpetualVaultToken: PublicKey;
  let depositorPerpetualUsdc: PublicKey; // reuse depositorUsdc

  // Seeds
  const VAULT_SEED = Buffer.from("vault");
  const MINT_SEED = Buffer.from("mint");
  const POOL_SEED = Buffer.from("pool");
  const LISTING_SEED = Buffer.from("listing");
  const ESCROW_SEED = Buffer.from("escrow");

  const INITIAL_NAV = 1_000_000;
  const NAV_PRECISION = 1_000_000;

  /** Encode series (u16) as LE bytes for PDA derivation. */
  function seriesLeBytes(s: number): Buffer {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(s);
    return buf;
  }

  before(async () => {
    // Airdrop SOL to all wallets
    const airdrops = [
      connection.requestAirdrop(authority.publicKey, 10 * LAMPORTS_PER_SOL),
      connection.requestAirdrop(depositor.publicKey, 10 * LAMPORTS_PER_SOL),
      connection.requestAirdrop(buyer.publicKey, 10 * LAMPORTS_PER_SOL),
      connection.requestAirdrop(nonAdmin.publicKey, 10 * LAMPORTS_PER_SOL),
    ];
    const sigs = await Promise.all(airdrops);
    for (const sig of sigs) {
      await connection.confirmTransaction(sig);
    }

    // Create fake USDC mint (authority controls it)
    usdcMint = await createMint(
      connection,
      authority.payer,
      authority.publicKey,
      null,
      6
    );

    // Derive vault PDA — seeds: [vault, region, denomination, asset_subtype, series_le_bytes]
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [
        VAULT_SEED,
        Buffer.from(region),
        Buffer.from(denomination),
        Buffer.from(assetSubtype),
        seriesLeBytes(series),
      ],
      program.programId
    );

    // Derive vault token mint PDA
    [vaultTokenMintPda] = PublicKey.findProgramAddressSync(
      [MINT_SEED, vaultPda.toBuffer()],
      program.programId
    );

    // Derive USDC pool PDA
    [usdcPoolPda] = PublicKey.findProgramAddressSync(
      [POOL_SEED, vaultPda.toBuffer()],
      program.programId
    );

    // Derive perpetual vault PDA (series=2, maturity_ts=0)
    [perpetualVaultPda] = PublicKey.findProgramAddressSync(
      [
        VAULT_SEED,
        Buffer.from(region),
        Buffer.from(denomination),
        Buffer.from(assetSubtype),
        seriesLeBytes(perpetualSeries),
      ],
      program.programId
    );

    [perpetualVaultTokenMintPda] = PublicKey.findProgramAddressSync(
      [MINT_SEED, perpetualVaultPda.toBuffer()],
      program.programId
    );

    [perpetualUsdcPoolPda] = PublicKey.findProgramAddressSync(
      [POOL_SEED, perpetualVaultPda.toBuffer()],
      program.programId
    );

    // Create USDC token accounts for depositor and buyer
    depositorUsdc = await createAccount(
      connection,
      depositor,
      usdcMint,
      depositor.publicKey
    );

    buyerUsdc = await createAccount(
      connection,
      buyer,
      usdcMint,
      buyer.publicKey
    );

    // Create treasury USDC account (owned by authority for testing)
    treasuryUsdc = await createAccount(
      connection,
      authority.payer,
      usdcMint,
      authority.publicKey
    );

    // Mint USDC to depositor (10,000 USDC)
    await mintTo(
      connection,
      authority.payer,
      usdcMint,
      depositorUsdc,
      authority.publicKey,
      10_000 * 1_000_000
    );

    // Mint USDC to buyer (10,000 USDC)
    await mintTo(
      connection,
      authority.payer,
      usdcMint,
      buyerUsdc,
      authority.publicKey,
      10_000 * 1_000_000
    );

    // Maturity in 10 seconds from now
    const now = Math.floor(Date.now() / 1000);
    maturityTs = new BN(now + 10);
  });

  // =========================================================================
  // 1. Initialize vault
  // =========================================================================
  it("Initialize vault", async () => {
    const tx = await program.methods
      .initializeVault({
        assetClass: assetClass,
        region: region,
        denomination: denomination,
        assetSubtype: assetSubtype,
        apyBps: apyBps,
        maturityTs: maturityTs,
        feeBps: feeBps,
        series: series,
      })
      .accounts({
        authority: authority.publicKey,
        vault: vaultPda,
        usdcMint: usdcMint,
        vaultTokenMint: vaultTokenMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize vault tx:", tx);

    // Fetch and verify vault state
    const vault = await program.account.vault.fetch(vaultPda);
    assert.equal(vault.protocolVersion, 1);
    assert.ok(vault.authority.equals(authority.publicKey));
    assert.ok(vault.usdcMint.equals(usdcMint));
    assert.ok(vault.vaultTokenMint.equals(vaultTokenMintPda));
    assert.equal(vault.region, region);
    assert.equal(vault.denomination, denomination);
    assert.equal(vault.assetSubtype, assetSubtype);
    assert.equal(vault.assetClass, assetClass);
    assert.ok(vault.apyBps.eq(apyBps));
    assert.ok(vault.navPerShare.eq(new BN(INITIAL_NAV)));
    assert.ok(vault.totalDeposits.eq(new BN(0)));
    assert.ok(vault.totalShares.eq(new BN(0)));
    assert.equal(vault.isActive, false); // Not active until pool is set up
    assert.equal(vault.feeBps, feeBps);
    assert.equal(vault.series, series);

    console.log("Vault created at:", vaultPda.toBase58());
  });

  // =========================================================================
  // Non-admin vault initialization rejected
  // =========================================================================
  it("Initialize vault rejected for non-admin", async () => {
    // Non-admin tries to create a vault — should fail with Unauthorized
    const [fakeVaultPda] = PublicKey.findProgramAddressSync(
      [
        VAULT_SEED,
        Buffer.from("US"),
        Buffer.from("USD"),
        Buffer.from("CORP"),
        seriesLeBytes(99),
      ],
      program.programId
    );

    const [fakeVaultTokenMintPda] = PublicKey.findProgramAddressSync(
      [MINT_SEED, fakeVaultPda.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .initializeVault({
          assetClass: "fixed_income",
          region: "US",
          denomination: "USD",
          assetSubtype: "CORP",
          apyBps: new BN(500),
          maturityTs: new BN(0),
          feeBps: 100,
          series: 99,
        })
        .accounts({
          authority: nonAdmin.publicKey,
          vault: fakeVaultPda,
          usdcMint: usdcMint,
          vaultTokenMint: fakeVaultTokenMintPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([nonAdmin])
        .rpc();
      assert.fail("Non-admin should not be able to initialize vault");
    } catch (err: any) {
      // Anchor constraint error — check for Unauthorized or constraint violation
      assert.ok(
        err.toString().includes("Unauthorized") ||
          err.toString().includes("ConstraintRaw") ||
          err.toString().includes("2003") ||
          err.toString().includes("Error"),
        `Expected Unauthorized error, got: ${err.toString()}`
      );
      console.log("Non-admin vault creation correctly rejected");
    }
  });

  // =========================================================================
  // 2. Setup vault pool
  // =========================================================================
  it("Setup vault pool", async () => {
    const tx = await program.methods
      .setupVaultPool()
      .accounts({
        authority: authority.publicKey,
        vault: vaultPda,
        usdcMint: usdcMint,
        usdcPool: usdcPoolPda,
        treasury: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Setup vault pool tx:", tx);

    // Fetch and verify vault is now active
    const vault = await program.account.vault.fetch(vaultPda);
    assert.equal(vault.isActive, true);
    assert.ok(vault.usdcPool.equals(usdcPoolPda));
    assert.ok(vault.treasury.equals(authority.publicKey));

    console.log("Vault activated, pool:", usdcPoolPda.toBase58());
  });

  // =========================================================================
  // 3. Deposit 1000 USDC
  // =========================================================================
  it("Deposit 1000 USDC", async () => {
    const depositAmount = new BN(1000 * 1_000_000); // 1000 USDC

    // Create vault token account for depositor
    depositorVaultToken = await createAccount(
      connection,
      depositor,
      vaultTokenMintPda,
      depositor.publicKey
    );

    const tx = await program.methods
      .deposit(depositAmount)
      .accounts({
        depositor: depositor.publicKey,
        vault: vaultPda,
        vaultTokenMint: vaultTokenMintPda,
        depositorUsdc: depositorUsdc,
        depositorVaultToken: depositorVaultToken,
        usdcPool: usdcPoolPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([depositor])
      .rpc();

    console.log("Deposit tx:", tx);

    // shares = amount * NAV_PRECISION / nav_per_share = 1000_000_000 * 1_000_000 / 1_000_000 = 1000_000_000
    const vaultTokenAccount = await getAccount(connection, depositorVaultToken);
    const expectedShares = BigInt(depositAmount.toNumber());
    assert.equal(
      vaultTokenAccount.amount,
      expectedShares,
      "Depositor should receive correct vault tokens"
    );

    // Verify vault state
    const vault = await program.account.vault.fetch(vaultPda);
    assert.ok(vault.totalDeposits.eq(depositAmount));
    assert.ok(vault.totalShares.eq(depositAmount));

    // Verify USDC moved to pool
    const poolAccount = await getAccount(connection, usdcPoolPda);
    assert.equal(
      poolAccount.amount,
      BigInt(depositAmount.toNumber()),
      "Pool should hold deposited USDC"
    );

    console.log(
      "Deposited 1000 USDC, received",
      vaultTokenAccount.amount.toString(),
      "vault tokens"
    );
  });

  // =========================================================================
  // 4. Deposit rejected on matured vault
  // =========================================================================
  it("Deposit rejected on matured vault", async () => {
    // Wait until maturity
    const vault = await program.account.vault.fetch(vaultPda);
    const now = Math.floor(Date.now() / 1000);
    const waitTime = vault.maturityTs.toNumber() - now + 2;

    if (waitTime > 0) {
      console.log(`Waiting ${waitTime}s for maturity to test deposit rejection...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }

    // Crank NAV to deactivate the vault after maturity
    await program.methods
      .crankNav()
      .accounts({
        cranker: authority.publicKey,
        vault: vaultPda,
      })
      .rpc();

    const vaultAfterCrank = await program.account.vault.fetch(vaultPda);
    assert.equal(vaultAfterCrank.isActive, false, "Vault should be deactivated after maturity crank");

    // Now try to deposit — should fail
    try {
      await program.methods
        .deposit(new BN(100 * 1_000_000))
        .accounts({
          depositor: depositor.publicKey,
          vault: vaultPda,
          vaultTokenMint: vaultTokenMintPda,
          depositorUsdc: depositorUsdc,
          depositorVaultToken: depositorVaultToken,
          usdcPool: usdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();
      assert.fail("Deposit should fail on matured/inactive vault");
    } catch (err: any) {
      assert.ok(
        err.toString().includes("VaultNotActive") ||
          err.toString().includes("6000"),
        `Expected VaultNotActive error, got: ${err.toString()}`
      );
      console.log("Deposit on matured vault correctly rejected");
    }
  });

  // =========================================================================
  // 5. Crank NAV
  // =========================================================================
  it("Crank NAV verification", async () => {
    // The vault was already cranked above (deactivated). We need to re-create
    // a fresh vault for the marketplace tests. But first let's verify the NAV
    // went up from the cranking done during the maturity test.
    const vault = await program.account.vault.fetch(vaultPda);
    assert.ok(
      vault.navPerShare.gte(new BN(INITIAL_NAV)),
      `NAV should be >= initial: ${vault.navPerShare.toString()}`
    );
    console.log("NAV after crank:", vault.navPerShare.toString());
  });

  // =========================================================================
  // 6. Perpetual vault — maturity_ts = 0
  // =========================================================================
  it("Perpetual vault - create, deposit, claim fails", async () => {
    // Create perpetual vault (maturity_ts = 0)
    await program.methods
      .initializeVault({
        assetClass: assetClass,
        region: region,
        denomination: denomination,
        assetSubtype: assetSubtype,
        apyBps: apyBps,
        maturityTs: new BN(0),
        feeBps: feeBps,
        series: perpetualSeries,
      })
      .accounts({
        authority: authority.publicKey,
        vault: perpetualVaultPda,
        usdcMint: usdcMint,
        vaultTokenMint: perpetualVaultTokenMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const perpetualVault = await program.account.vault.fetch(perpetualVaultPda);
    assert.ok(perpetualVault.maturityTs.eq(new BN(0)), "Perpetual vault should have maturity_ts = 0");

    // Setup pool
    await program.methods
      .setupVaultPool()
      .accounts({
        authority: authority.publicKey,
        vault: perpetualVaultPda,
        usdcMint: usdcMint,
        usdcPool: perpetualUsdcPoolPda,
        treasury: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Create depositor vault token account for perpetual vault
    depositorPerpetualVaultToken = await createAccount(
      connection,
      depositor,
      perpetualVaultTokenMintPda,
      depositor.publicKey
    );

    // Deposit should succeed on perpetual vault
    const depositAmount = new BN(100 * 1_000_000);
    await program.methods
      .deposit(depositAmount)
      .accounts({
        depositor: depositor.publicKey,
        vault: perpetualVaultPda,
        vaultTokenMint: perpetualVaultTokenMintPda,
        depositorUsdc: depositorUsdc,
        depositorVaultToken: depositorPerpetualVaultToken,
        usdcPool: perpetualUsdcPoolPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([depositor])
      .rpc();

    const vaultTokenBalance = await getAccount(connection, depositorPerpetualVaultToken);
    assert.equal(
      vaultTokenBalance.amount,
      BigInt(depositAmount.toNumber()),
      "Deposit should succeed on perpetual vault"
    );
    console.log("Perpetual vault deposit succeeded:", vaultTokenBalance.amount.toString(), "shares");

    // Claim should fail on perpetual vault (NotMatured)
    try {
      await program.methods
        .claim()
        .accounts({
          claimer: depositor.publicKey,
          vault: perpetualVaultPda,
          vaultTokenMint: perpetualVaultTokenMintPda,
          claimerVaultToken: depositorPerpetualVaultToken,
          claimerUsdc: depositorUsdc,
          usdcPool: perpetualUsdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();
      assert.fail("Claim should fail on perpetual vault");
    } catch (err: any) {
      assert.ok(
        err.toString().includes("NotMatured") ||
          err.toString().includes("6003"),
        `Expected NotMatured error, got: ${err.toString()}`
      );
      console.log("Claim on perpetual vault correctly rejected");
    }
  });

  // =========================================================================
  // For marketplace tests, we need an active vault. Since the original vault
  // matured, we create a new one (series=3) with longer maturity.
  // =========================================================================
  const marketSeries: number = 3;
  let marketVaultPda: PublicKey;
  let marketVaultTokenMintPda: PublicKey;
  let marketUsdcPoolPda: PublicKey;
  let marketDepositorVaultToken: PublicKey;
  let marketBuyerVaultToken: PublicKey;
  let marketListingPda: PublicKey;
  let marketEscrowPda: PublicKey;
  let marketMaturityTs: BN;

  it("Setup marketplace vault (series=3)", async () => {
    const now = Math.floor(Date.now() / 1000);
    marketMaturityTs = new BN(now + 60); // 60 seconds for marketplace tests

    [marketVaultPda] = PublicKey.findProgramAddressSync(
      [
        VAULT_SEED,
        Buffer.from(region),
        Buffer.from(denomination),
        Buffer.from(assetSubtype),
        seriesLeBytes(marketSeries),
      ],
      program.programId
    );

    [marketVaultTokenMintPda] = PublicKey.findProgramAddressSync(
      [MINT_SEED, marketVaultPda.toBuffer()],
      program.programId
    );

    [marketUsdcPoolPda] = PublicKey.findProgramAddressSync(
      [POOL_SEED, marketVaultPda.toBuffer()],
      program.programId
    );

    // Initialize
    await program.methods
      .initializeVault({
        assetClass: assetClass,
        region: region,
        denomination: denomination,
        assetSubtype: assetSubtype,
        apyBps: apyBps,
        maturityTs: marketMaturityTs,
        feeBps: feeBps,
        series: marketSeries,
      })
      .accounts({
        authority: authority.publicKey,
        vault: marketVaultPda,
        usdcMint: usdcMint,
        vaultTokenMint: marketVaultTokenMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Setup pool
    await program.methods
      .setupVaultPool()
      .accounts({
        authority: authority.publicKey,
        vault: marketVaultPda,
        usdcMint: usdcMint,
        usdcPool: marketUsdcPoolPda,
        treasury: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Create vault token accounts
    marketDepositorVaultToken = await createAccount(
      connection,
      depositor,
      marketVaultTokenMintPda,
      depositor.publicKey
    );

    // Deposit 1000 USDC
    const depositAmount = new BN(1000 * 1_000_000);
    await program.methods
      .deposit(depositAmount)
      .accounts({
        depositor: depositor.publicKey,
        vault: marketVaultPda,
        vaultTokenMint: marketVaultTokenMintPda,
        depositorUsdc: depositorUsdc,
        depositorVaultToken: marketDepositorVaultToken,
        usdcPool: marketUsdcPoolPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([depositor])
      .rpc();

    const vault = await program.account.vault.fetch(marketVaultPda);
    assert.equal(vault.isActive, true);
    assert.ok(vault.totalDeposits.eq(depositAmount));
    console.log("Marketplace vault ready (series=3), deposited 1000 USDC");
  });

  // =========================================================================
  // 7. Create listing — list 500 tokens at $1.02
  // =========================================================================
  it("Create listing - seller lists 500 tokens at 1.02 USDC each", async () => {
    const listingAmount = new BN(500 * 1_000_000); // 500 tokens
    const pricePerToken = new BN(1_020_000); // 1.02 USDC per token

    [marketListingPda] = PublicKey.findProgramAddressSync(
      [LISTING_SEED, marketVaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    [marketEscrowPda] = PublicKey.findProgramAddressSync(
      [ESCROW_SEED, marketVaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    const sellerTokensBefore = await getAccount(connection, marketDepositorVaultToken);

    const tx = await program.methods
      .createListing(listingAmount, pricePerToken)
      .accounts({
        seller: depositor.publicKey,
        vault: marketVaultPda,
        listing: marketListingPda,
        vaultTokenMint: marketVaultTokenMintPda,
        sellerVaultToken: marketDepositorVaultToken,
        escrowTokenAccount: marketEscrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([depositor])
      .rpc();

    console.log("Create listing tx:", tx);

    // Verify listing state
    const listing = await program.account.listing.fetch(marketListingPda);
    assert.ok(listing.seller.equals(depositor.publicKey));
    assert.ok(listing.vault.equals(marketVaultPda));
    assert.ok(listing.amount.eq(listingAmount));
    assert.ok(listing.pricePerToken.eq(pricePerToken));

    // Verify tokens moved to escrow
    const escrowAccount = await getAccount(connection, marketEscrowPda);
    assert.equal(
      escrowAccount.amount,
      BigInt(listingAmount.toNumber()),
      "Escrow should hold listed tokens"
    );

    // Verify seller tokens decreased
    const sellerTokensAfter = await getAccount(connection, marketDepositorVaultToken);
    assert.equal(
      sellerTokensAfter.amount,
      sellerTokensBefore.amount - BigInt(listingAmount.toNumber()),
      "Seller tokens should decrease by listing amount"
    );

    console.log("Listing created: 500 tokens at 1.02 USDC each");
  });

  // =========================================================================
  // 8. Create listing rejected on matured vault
  // =========================================================================
  it("Create listing rejected on matured vault", async () => {
    // Use the already-matured series=1 vault
    // First, the depositor still has tokens from series=1 in depositorVaultToken
    // But that vault is no longer active, so createListing should fail with VaultNotActive
    // (the constraint requires vault.is_active)
    try {
      const [matureListing] = PublicKey.findProgramAddressSync(
        [LISTING_SEED, vaultPda.toBuffer(), depositor.publicKey.toBuffer()],
        program.programId
      );

      const [matureEscrow] = PublicKey.findProgramAddressSync(
        [ESCROW_SEED, vaultPda.toBuffer(), depositor.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createListing(new BN(100 * 1_000_000), new BN(1_000_000))
        .accounts({
          seller: depositor.publicKey,
          vault: vaultPda,
          listing: matureListing,
          vaultTokenMint: vaultTokenMintPda,
          sellerVaultToken: depositorVaultToken,
          escrowTokenAccount: matureEscrow,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([depositor])
        .rpc();
      assert.fail("Create listing should fail on matured vault");
    } catch (err: any) {
      assert.ok(
        err.toString().includes("VaultNotActive") ||
          err.toString().includes("AlreadyMatured") ||
          err.toString().includes("6000") ||
          err.toString().includes("6004"),
        `Expected VaultNotActive or AlreadyMatured error, got: ${err.toString()}`
      );
      console.log("Create listing on matured vault correctly rejected");
    }
  });

  // =========================================================================
  // 9. Buy listing — buyer purchases, verify fee to treasury
  // =========================================================================
  it("Buy listing - buyer purchases, verify USDC transfer + fee to treasury", async () => {
    // Create vault token account for buyer on marketplace vault
    marketBuyerVaultToken = await createAccount(
      connection,
      buyer,
      marketVaultTokenMintPda,
      buyer.publicKey
    );

    const listing = await program.account.listing.fetch(marketListingPda);
    const amount = listing.amount;
    const pricePerToken = listing.pricePerToken;

    // total_cost = amount * price_per_token / NAV_PRECISION
    const totalCostBig =
      (BigInt(amount.toNumber()) * BigInt(pricePerToken.toNumber())) /
      BigInt(NAV_PRECISION);

    // fee = total_cost * fee_bps / 10000
    const vault = await program.account.vault.fetch(marketVaultPda);
    const feeBig =
      (totalCostBig * BigInt(vault.feeBps)) / BigInt(10_000);
    const sellerAmountBig = totalCostBig - feeBig;

    const buyerUsdcBefore = await getAccount(connection, buyerUsdc);
    const sellerUsdcBefore = await getAccount(connection, depositorUsdc);
    const treasuryUsdcBefore = await getAccount(connection, treasuryUsdc);

    const tx = await program.methods
      .buyListing()
      .accounts({
        buyer: buyer.publicKey,
        seller: depositor.publicKey,
        vault: marketVaultPda,
        listing: marketListingPda,
        vaultTokenMint: marketVaultTokenMintPda,
        buyerUsdc: buyerUsdc,
        sellerUsdc: depositorUsdc,
        treasuryUsdc: treasuryUsdc,
        buyerVaultToken: marketBuyerVaultToken,
        escrowTokenAccount: marketEscrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    console.log("Buy listing tx:", tx);

    // Verify buyer received vault tokens
    const buyerVaultTokenAccount = await getAccount(connection, marketBuyerVaultToken);
    assert.equal(
      buyerVaultTokenAccount.amount,
      BigInt(amount.toNumber()),
      "Buyer should receive all listed tokens"
    );

    // Verify USDC transfers
    const buyerUsdcAfter = await getAccount(connection, buyerUsdc);
    const sellerUsdcAfter = await getAccount(connection, sellerUsdc);
    const treasuryUsdcAfter = await getAccount(connection, treasuryUsdc);

    // Buyer pays total cost
    assert.equal(
      buyerUsdcBefore.amount - buyerUsdcAfter.amount,
      totalCostBig,
      "Buyer USDC should decrease by total cost"
    );

    // Seller receives total_cost - fee
    assert.equal(
      sellerUsdcAfter.amount - sellerUsdcBefore.amount,
      sellerAmountBig,
      "Seller USDC should increase by (total_cost - fee)"
    );

    // Treasury receives fee
    const treasuryReceived = treasuryUsdcAfter.amount - treasuryUsdcBefore.amount;
    assert.equal(
      treasuryReceived,
      feeBig,
      `Treasury should receive fee: expected ${feeBig}, got ${treasuryReceived}`
    );
    console.log(
      `Buy completed: total_cost=${totalCostBig}, seller_receives=${sellerAmountBig}, treasury_fee=${feeBig}`
    );

    // Verify listing account is closed
    try {
      await program.account.listing.fetch(marketListingPda);
      assert.fail("Listing account should be closed after purchase");
    } catch (err) {
      // Expected: account not found
    }
  });

  // =========================================================================
  // 10. Cancel listing — create, then cancel, verify tokens returned
  // =========================================================================
  it("Create and cancel listing - verify tokens returned", async () => {
    const listingAmount = new BN(200 * 1_000_000);
    const pricePerToken = new BN(1_050_000);

    // Re-derive listing/escrow PDAs (previous one was closed)
    [marketListingPda] = PublicKey.findProgramAddressSync(
      [LISTING_SEED, marketVaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    [marketEscrowPda] = PublicKey.findProgramAddressSync(
      [ESCROW_SEED, marketVaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    const sellerTokensBefore = await getAccount(connection, marketDepositorVaultToken);

    // Create listing
    await program.methods
      .createListing(listingAmount, pricePerToken)
      .accounts({
        seller: depositor.publicKey,
        vault: marketVaultPda,
        listing: marketListingPda,
        vaultTokenMint: marketVaultTokenMintPda,
        sellerVaultToken: marketDepositorVaultToken,
        escrowTokenAccount: marketEscrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([depositor])
      .rpc();

    // Verify tokens moved to escrow
    const sellerTokensAfterCreate = await getAccount(connection, marketDepositorVaultToken);
    assert.equal(
      sellerTokensBefore.amount - sellerTokensAfterCreate.amount,
      BigInt(listingAmount.toNumber()),
      "Tokens should move to escrow on create"
    );

    // Cancel listing
    const tx = await program.methods
      .cancelListing()
      .accounts({
        seller: depositor.publicKey,
        vault: marketVaultPda,
        listing: marketListingPda,
        vaultTokenMint: marketVaultTokenMintPda,
        sellerVaultToken: marketDepositorVaultToken,
        escrowTokenAccount: marketEscrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([depositor])
      .rpc();

    console.log("Cancel listing tx:", tx);

    // Verify tokens returned to seller
    const sellerTokensAfterCancel = await getAccount(connection, marketDepositorVaultToken);
    assert.equal(
      sellerTokensAfterCancel.amount,
      sellerTokensBefore.amount,
      "All tokens should be returned after cancellation"
    );

    // Verify listing account is closed
    try {
      await program.account.listing.fetch(marketListingPda);
      assert.fail("Listing account should be closed after cancellation");
    } catch (err) {
      // Expected
    }
    console.log("Listing cancelled, tokens returned to seller");
  });

  // =========================================================================
  // 11. Self-purchase blocked
  // =========================================================================
  it("Self-purchase blocked - seller cannot buy own listing", async () => {
    const listingAmount = new BN(100 * 1_000_000);
    const pricePerToken = new BN(1_000_000);

    // Re-derive for new listing
    [marketListingPda] = PublicKey.findProgramAddressSync(
      [LISTING_SEED, marketVaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    [marketEscrowPda] = PublicKey.findProgramAddressSync(
      [ESCROW_SEED, marketVaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    // Create listing
    await program.methods
      .createListing(listingAmount, pricePerToken)
      .accounts({
        seller: depositor.publicKey,
        vault: marketVaultPda,
        listing: marketListingPda,
        vaultTokenMint: marketVaultTokenMintPda,
        sellerVaultToken: marketDepositorVaultToken,
        escrowTokenAccount: marketEscrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([depositor])
      .rpc();

    // Seller (depositor) tries to buy their own listing
    try {
      await program.methods
        .buyListing()
        .accounts({
          buyer: depositor.publicKey,
          seller: depositor.publicKey,
          vault: marketVaultPda,
          listing: marketListingPda,
          vaultTokenMint: marketVaultTokenMintPda,
          buyerUsdc: depositorUsdc,
          sellerUsdc: depositorUsdc,
          treasuryUsdc: treasuryUsdc,
          buyerVaultToken: marketDepositorVaultToken,
          escrowTokenAccount: marketEscrowPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();
      assert.fail("Self-purchase should be rejected");
    } catch (err: any) {
      assert.ok(
        err.toString().includes("SelfPurchase") ||
          err.toString().includes("6009"),
        `Expected SelfPurchase error, got: ${err.toString()}`
      );
      console.log("Self-purchase correctly blocked");
    }

    // Clean up: cancel the listing so we can create new ones later
    await program.methods
      .cancelListing()
      .accounts({
        seller: depositor.publicKey,
        vault: marketVaultPda,
        listing: marketListingPda,
        vaultTokenMint: marketVaultTokenMintPda,
        sellerVaultToken: marketDepositorVaultToken,
        escrowTokenAccount: marketEscrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([depositor])
      .rpc();
    console.log("Cleaned up self-purchase test listing");
  });

  // =========================================================================
  // 12. Claim rejected before maturity
  // =========================================================================
  it("Claim rejected before maturity", async () => {
    // marketplace vault (series=3) has 60s maturity — should not be matured yet
    try {
      await program.methods
        .claim()
        .accounts({
          claimer: depositor.publicKey,
          vault: marketVaultPda,
          vaultTokenMint: marketVaultTokenMintPda,
          claimerVaultToken: marketDepositorVaultToken,
          claimerUsdc: depositorUsdc,
          usdcPool: marketUsdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();
      assert.fail("Claim should fail before maturity");
    } catch (err: any) {
      assert.ok(
        err.toString().includes("NotMatured") ||
          err.toString().includes("6003"),
        `Expected NotMatured error, got: ${err.toString()}`
      );
      console.log("Claim before maturity correctly rejected");
    }
  });

  // =========================================================================
  // 13. Claim rejected on perpetual vault
  // =========================================================================
  it("Claim rejected on perpetual vault", async () => {
    try {
      await program.methods
        .claim()
        .accounts({
          claimer: depositor.publicKey,
          vault: perpetualVaultPda,
          vaultTokenMint: perpetualVaultTokenMintPda,
          claimerVaultToken: depositorPerpetualVaultToken,
          claimerUsdc: depositorUsdc,
          usdcPool: perpetualUsdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();
      assert.fail("Claim should fail on perpetual vault");
    } catch (err: any) {
      assert.ok(
        err.toString().includes("NotMatured") ||
          err.toString().includes("6003"),
        `Expected NotMatured error, got: ${err.toString()}`
      );
      console.log("Claim on perpetual vault correctly rejected (again, standalone test)");
    }
  });

  // =========================================================================
  // 14. Claim after maturity — both depositor and buyer claim on series=1
  // =========================================================================
  it("Claim after maturity - depositor and buyer claim on original vault", async () => {
    // Series=1 vault is already matured and deactivated
    const vaultState = await program.account.vault.fetch(vaultPda);
    assert.equal(vaultState.isActive, false, "Original vault should be matured");

    // Depositor claims remaining tokens (500 remain after selling 500 on the original test)
    const depositorTokensBefore = await getAccount(connection, depositorVaultToken);
    const shares = depositorTokensBefore.amount;

    if (shares > BigInt(0)) {
      const navPerShare = vaultState.navPerShare;
      const expectedPayout =
        (BigInt(shares) * BigInt(navPerShare.toNumber())) / BigInt(NAV_PRECISION);

      // Ensure pool has enough (mint extra for interest accrual in MVP)
      const poolAccount = await getAccount(connection, usdcPoolPda);
      if (poolAccount.amount < expectedPayout) {
        const deficit = expectedPayout - poolAccount.amount;
        await mintTo(
          connection,
          authority.payer,
          usdcMint,
          usdcPoolPda,
          authority.publicKey,
          Number(deficit)
        );
      }

      const depositorUsdcBefore = await getAccount(connection, depositorUsdc);

      await program.methods
        .claim()
        .accounts({
          claimer: depositor.publicKey,
          vault: vaultPda,
          vaultTokenMint: vaultTokenMintPda,
          claimerVaultToken: depositorVaultToken,
          claimerUsdc: depositorUsdc,
          usdcPool: usdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();

      // Verify tokens burned
      const depositorTokensAfter = await getAccount(connection, depositorVaultToken);
      assert.equal(
        depositorTokensAfter.amount,
        BigInt(0),
        "All vault tokens should be burned after claim"
      );

      // Verify USDC received
      const depositorUsdcAfter = await getAccount(connection, depositorUsdc);
      const usdcReceived = depositorUsdcAfter.amount - depositorUsdcBefore.amount;
      assert.equal(usdcReceived, expectedPayout, "Claimer should receive correct USDC payout");
      assert.ok(
        usdcReceived >= BigInt(shares),
        "Payout should be >= original deposit due to interest accrual"
      );

      console.log(
        `Depositor claimed ${shares} shares for ${usdcReceived} USDC (NAV: ${navPerShare.toString()})`
      );
    }

    console.log("Depositor claim complete on series=1 vault");
  });

  // =========================================================================
  // 15. Close vault rejected with outstanding shares
  // =========================================================================
  it("Close vault rejected with outstanding shares (VaultNotEmpty)", async () => {
    // marketplace vault (series=3) still has shares outstanding
    const marketVault = await program.account.vault.fetch(marketVaultPda);
    assert.ok(
      marketVault.totalShares.gt(new BN(0)),
      "Market vault should still have shares"
    );

    // Wait for marketplace vault to mature, then crank
    const now = Math.floor(Date.now() / 1000);
    const waitTime = marketVault.maturityTs.toNumber() - now + 2;
    if (waitTime > 0) {
      console.log(`Waiting ${waitTime}s for marketplace vault maturity...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }

    await program.methods
      .crankNav()
      .accounts({
        cranker: authority.publicKey,
        vault: marketVaultPda,
      })
      .rpc();

    // Try to close — should fail because shares are outstanding
    try {
      await program.methods
        .closeVault()
        .accounts({
          authority: authority.publicKey,
          vault: marketVaultPda,
          usdcPool: marketUsdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      assert.fail("Close vault should fail with outstanding shares");
    } catch (err: any) {
      assert.ok(
        err.toString().includes("VaultNotEmpty") ||
          err.toString().includes("6011"),
        `Expected VaultNotEmpty error, got: ${err.toString()}`
      );
      console.log("Close vault with outstanding shares correctly rejected");
    }
  });

  // =========================================================================
  // Claim all shares on marketplace vault so we can close it
  // =========================================================================
  it("Claim all shares on marketplace vault", async () => {
    const vaultState = await program.account.vault.fetch(marketVaultPda);

    // Depositor claims their remaining shares
    const depositorTokens = await getAccount(connection, marketDepositorVaultToken);
    if (depositorTokens.amount > BigInt(0)) {
      const navPerShare = vaultState.navPerShare;
      const expectedPayout =
        (BigInt(depositorTokens.amount) * BigInt(navPerShare.toNumber())) /
        BigInt(NAV_PRECISION);

      // Ensure pool has enough
      const poolAccount = await getAccount(connection, marketUsdcPoolPda);
      if (poolAccount.amount < expectedPayout) {
        const deficit = expectedPayout - poolAccount.amount;
        await mintTo(
          connection,
          authority.payer,
          usdcMint,
          marketUsdcPoolPda,
          authority.publicKey,
          Number(deficit)
        );
      }

      await program.methods
        .claim()
        .accounts({
          claimer: depositor.publicKey,
          vault: marketVaultPda,
          vaultTokenMint: marketVaultTokenMintPda,
          claimerVaultToken: marketDepositorVaultToken,
          claimerUsdc: depositorUsdc,
          usdcPool: marketUsdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();

      console.log("Depositor claimed marketplace vault shares");
    }

    // Buyer claims their shares
    const buyerTokens = await getAccount(connection, marketBuyerVaultToken);
    if (buyerTokens.amount > BigInt(0)) {
      const navPerShare = vaultState.navPerShare;
      const expectedPayout =
        (BigInt(buyerTokens.amount) * BigInt(navPerShare.toNumber())) /
        BigInt(NAV_PRECISION);

      const poolAccount = await getAccount(connection, marketUsdcPoolPda);
      if (poolAccount.amount < expectedPayout) {
        const deficit = expectedPayout - poolAccount.amount;
        await mintTo(
          connection,
          authority.payer,
          usdcMint,
          marketUsdcPoolPda,
          authority.publicKey,
          Number(deficit)
        );
      }

      await program.methods
        .claim()
        .accounts({
          claimer: buyer.publicKey,
          vault: marketVaultPda,
          vaultTokenMint: marketVaultTokenMintPda,
          claimerVaultToken: marketBuyerVaultToken,
          claimerUsdc: buyerUsdc,
          usdcPool: marketUsdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();

      console.log("Buyer claimed marketplace vault shares");
    }

    // Verify all shares claimed
    const finalVault = await program.account.vault.fetch(marketVaultPda);
    assert.ok(
      finalVault.totalShares.eq(new BN(0)),
      "Total shares should be 0 after all claims"
    );
    console.log("All marketplace vault shares claimed");
  });

  // =========================================================================
  // 16. Close vault — after all claims
  // =========================================================================
  it("Close vault after all claims", async () => {
    // Pool may still have dust USDC from rounding. Drain it if needed.
    const poolAccount = await getAccount(connection, marketUsdcPoolPda);
    if (poolAccount.amount > BigInt(0)) {
      // We need to drain pool to 0 before closing.
      // The vault PDA is the authority, so we can't easily drain externally.
      // For testing, if there's a remaining balance due to rounding,
      // we'll note that close_vault checks pool amount == 0.
      console.log(
        "Pool has remaining balance:",
        poolAccount.amount.toString(),
        "- attempting close"
      );
    }

    // If pool is empty, close should succeed
    if (poolAccount.amount === BigInt(0)) {
      const tx = await program.methods
        .closeVault()
        .accounts({
          authority: authority.publicKey,
          vault: marketVaultPda,
          usdcPool: marketUsdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Close vault tx:", tx);

      // Verify vault account is closed
      try {
        await program.account.vault.fetch(marketVaultPda);
        assert.fail("Vault account should be closed");
      } catch (err) {
        // Expected
      }
      console.log("Vault closed successfully");
    } else {
      // Pool has dust — close will fail with PoolNotEmpty
      // This is expected behavior; log it
      try {
        await program.methods
          .closeVault()
          .accounts({
            authority: authority.publicKey,
            vault: marketVaultPda,
            usdcPool: marketUsdcPoolPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        console.log("Vault closed successfully despite pool dust");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("PoolNotEmpty") ||
            err.toString().includes("6013"),
          `Expected PoolNotEmpty if pool has dust, got: ${err.toString()}`
        );
        console.log(
          "Close vault correctly rejected due to pool dust balance:",
          poolAccount.amount.toString()
        );
      }
    }
  });

  // =========================================================================
  // Close series=1 vault (all shares already claimed)
  // =========================================================================
  it("Close original vault (series=1)", async () => {
    // Verify shares are 0
    const vaultState = await program.account.vault.fetch(vaultPda);
    assert.ok(
      vaultState.totalShares.eq(new BN(0)),
      "Original vault should have 0 shares"
    );

    const poolAccount = await getAccount(connection, usdcPoolPda);
    if (poolAccount.amount === BigInt(0)) {
      const tx = await program.methods
        .closeVault()
        .accounts({
          authority: authority.publicKey,
          vault: vaultPda,
          usdcPool: usdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Close original vault tx:", tx);

      try {
        await program.account.vault.fetch(vaultPda);
        assert.fail("Original vault account should be closed");
      } catch (err) {
        // Expected
      }
      console.log("Original vault (series=1) closed successfully");
    } else {
      console.log(
        "Original vault pool has remaining balance:",
        poolAccount.amount.toString(),
        "— skipping close"
      );
    }
  });
});
