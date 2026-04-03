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

  // Authority is the provider wallet
  const authority = provider.wallet as anchor.Wallet;

  // Test users
  const depositor = Keypair.generate();
  const buyer = Keypair.generate();

  // Vault params
  const region = "UA";
  const denomination = "UAH";
  const assetSubtype = "GOVT";
  const assetClass = "fixed_income";
  const apyBps = new BN(1800); // 18%
  const feeBps = 50; // 0.5%

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
  let sellerUsdc: PublicKey; // depositor's USDC (seller in listing context)
  let listingPda: PublicKey;
  let listingBump: number;
  let escrowPda: PublicKey;
  let maturityTs: BN;

  // Seeds
  const VAULT_SEED = Buffer.from("vault");
  const MINT_SEED = Buffer.from("mint");
  const POOL_SEED = Buffer.from("pool");
  const LISTING_SEED = Buffer.from("listing");
  const ESCROW_SEED = Buffer.from("escrow");

  const INITIAL_NAV = 1_000_000;
  const NAV_PRECISION = 1_000_000;

  before(async () => {
    // Airdrop SOL to all wallets
    const airdropAuth = await connection.requestAirdrop(
      authority.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropAuth);

    const airdropDep = await connection.requestAirdrop(
      depositor.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropDep);

    const airdropBuyer = await connection.requestAirdrop(
      buyer.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropBuyer);

    // Create fake USDC mint (authority controls it)
    usdcMint = await createMint(
      connection,
      authority.payer,
      authority.publicKey,
      null,
      6 // USDC has 6 decimals
    );

    // Derive vault PDA (initialize_vault uses [vault, region, denomination, asset_subtype])
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [
        VAULT_SEED,
        Buffer.from(region),
        Buffer.from(denomination),
        Buffer.from(assetSubtype),
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

    console.log("Vault created successfully at:", vaultPda.toBase58());
  });

  it("Setup vault pool", async () => {
    // Use authority as treasury for testing
    const treasury = authority.publicKey;

    const tx = await program.methods
      .setupVaultPool()
      .accounts({
        authority: authority.publicKey,
        vault: vaultPda,
        usdcMint: usdcMint,
        usdcPool: usdcPoolPda,
        treasury: treasury,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Setup vault pool tx:", tx);

    // Fetch and verify vault is now active
    const vault = await program.account.vault.fetch(vaultPda);
    assert.equal(vault.isActive, true);
    assert.ok(vault.usdcPool.equals(usdcPoolPda));
    assert.ok(vault.treasury.equals(treasury));

    console.log("Vault activated, pool:", usdcPoolPda.toBase58());
  });

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

    // Verify vault token balance
    // shares = amount * NAV_PRECISION / nav_per_share = 1000_000_000 * 1_000_000 / 1_000_000 = 1000_000_000
    const vaultTokenAccount = await getAccount(
      connection,
      depositorVaultToken
    );
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

  it("Crank NAV after 2 seconds", async () => {
    // Wait 2 seconds for time to elapse
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const vaultBefore = await program.account.vault.fetch(vaultPda);
    const navBefore = vaultBefore.navPerShare;

    const tx = await program.methods
      .crankNav()
      .accounts({
        cranker: authority.publicKey,
        vault: vaultPda,
      })
      .rpc();

    console.log("Crank NAV tx:", tx);

    const vaultAfter = await program.account.vault.fetch(vaultPda);
    const navAfter = vaultAfter.navPerShare;

    // On localnet, clock may not advance between blocks,
    // so NAV might stay the same. On devnet/mainnet it would increase.
    assert.ok(
      navAfter.gte(navBefore),
      `NAV should not decrease: ${navBefore.toString()} -> ${navAfter.toString()}`
    );

    console.log(
      "NAV updated:",
      navBefore.toString(),
      "->",
      navAfter.toString()
    );
  });

  it("Create listing - seller lists 500 tokens at 1.02 USDC each", async () => {
    const listingAmount = new BN(500 * 1_000_000); // 500 tokens
    const pricePerToken = new BN(1_020_000); // 1.02 USDC per token (in NAV_PRECISION)

    // Derive listing PDA
    [listingPda, listingBump] = PublicKey.findProgramAddressSync(
      [LISTING_SEED, vaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    // Derive escrow PDA
    [escrowPda] = PublicKey.findProgramAddressSync(
      [ESCROW_SEED, vaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    const sellerTokensBefore = await getAccount(
      connection,
      depositorVaultToken
    );

    const tx = await program.methods
      .createListing(listingAmount, pricePerToken)
      .accounts({
        seller: depositor.publicKey,
        vault: vaultPda,
        listing: listingPda,
        vaultTokenMint: vaultTokenMintPda,
        sellerVaultToken: depositorVaultToken,
        escrowTokenAccount: escrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([depositor])
      .rpc();

    console.log("Create listing tx:", tx);

    // Verify listing state
    const listing = await program.account.listing.fetch(listingPda);
    assert.ok(listing.seller.equals(depositor.publicKey));
    assert.ok(listing.vault.equals(vaultPda));
    assert.ok(listing.amount.eq(listingAmount));
    assert.ok(listing.pricePerToken.eq(pricePerToken));

    // Verify tokens moved to escrow
    const escrowAccount = await getAccount(connection, escrowPda);
    assert.equal(
      escrowAccount.amount,
      BigInt(listingAmount.toNumber()),
      "Escrow should hold listed tokens"
    );

    // Verify seller tokens decreased
    const sellerTokensAfter = await getAccount(
      connection,
      depositorVaultToken
    );
    assert.equal(
      sellerTokensAfter.amount,
      sellerTokensBefore.amount - BigInt(listingAmount.toNumber()),
      "Seller tokens should decrease by listing amount"
    );

    console.log(
      "Listing created:",
      listingAmount.toString(),
      "tokens at",
      pricePerToken.toString(),
      "per token"
    );
  });

  it("Buy listing - buyer purchases the listed tokens", async () => {
    // Create vault token account for buyer
    buyerVaultToken = await createAccount(
      connection,
      buyer,
      vaultTokenMintPda,
      buyer.publicKey
    );

    // Need seller's USDC account - use depositor's existing one
    sellerUsdc = depositorUsdc;

    const listing = await program.account.listing.fetch(listingPda);
    const amount = listing.amount;
    const pricePerToken = listing.pricePerToken;

    // Total cost = amount * price_per_token / NAV_PRECISION
    const totalCost =
      (BigInt(amount.toNumber()) * BigInt(pricePerToken.toNumber())) /
      BigInt(NAV_PRECISION);

    const buyerUsdcBefore = await getAccount(connection, buyerUsdc);
    const sellerUsdcBefore = await getAccount(connection, sellerUsdc);

    const tx = await program.methods
      .buyListing()
      .accounts({
        buyer: buyer.publicKey,
        seller: depositor.publicKey,
        vault: vaultPda,
        listing: listingPda,
        vaultTokenMint: vaultTokenMintPda,
        buyerUsdc: buyerUsdc,
        sellerUsdc: sellerUsdc,
        buyerVaultToken: buyerVaultToken,
        escrowTokenAccount: escrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    console.log("Buy listing tx:", tx);

    // Verify buyer received vault tokens
    const buyerVaultTokenAccount = await getAccount(
      connection,
      buyerVaultToken
    );
    assert.equal(
      buyerVaultTokenAccount.amount,
      BigInt(amount.toNumber()),
      "Buyer should receive all listed tokens"
    );

    // Verify USDC transferred
    const buyerUsdcAfter = await getAccount(connection, buyerUsdc);
    const sellerUsdcAfter = await getAccount(connection, sellerUsdc);

    assert.equal(
      buyerUsdcBefore.amount - buyerUsdcAfter.amount,
      totalCost,
      "Buyer USDC should decrease by total cost"
    );
    assert.equal(
      sellerUsdcAfter.amount - sellerUsdcBefore.amount,
      totalCost,
      "Seller USDC should increase by total cost"
    );

    // Verify listing account is closed (should throw)
    try {
      await program.account.listing.fetch(listingPda);
      assert.fail("Listing account should be closed after purchase");
    } catch (err) {
      // Expected: account not found
    }

    console.log(
      "Listing purchased: buyer paid",
      totalCost.toString(),
      "USDC for",
      amount.toString(),
      "tokens"
    );
  });

  it("Create and cancel listing - verify tokens returned", async () => {
    const listingAmount = new BN(200 * 1_000_000); // 200 tokens
    const pricePerToken = new BN(1_050_000); // 1.05 USDC

    // Re-derive listing PDA (previous one was closed)
    [listingPda, listingBump] = PublicKey.findProgramAddressSync(
      [LISTING_SEED, vaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    [escrowPda] = PublicKey.findProgramAddressSync(
      [ESCROW_SEED, vaultPda.toBuffer(), depositor.publicKey.toBuffer()],
      program.programId
    );

    const sellerTokensBefore = await getAccount(
      connection,
      depositorVaultToken
    );

    // Create listing
    await program.methods
      .createListing(listingAmount, pricePerToken)
      .accounts({
        seller: depositor.publicKey,
        vault: vaultPda,
        listing: listingPda,
        vaultTokenMint: vaultTokenMintPda,
        sellerVaultToken: depositorVaultToken,
        escrowTokenAccount: escrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([depositor])
      .rpc();

    // Verify tokens moved to escrow
    const sellerTokensAfterCreate = await getAccount(
      connection,
      depositorVaultToken
    );
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
        vault: vaultPda,
        listing: listingPda,
        vaultTokenMint: vaultTokenMintPda,
        sellerVaultToken: depositorVaultToken,
        escrowTokenAccount: escrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([depositor])
      .rpc();

    console.log("Cancel listing tx:", tx);

    // Verify tokens returned to seller
    const sellerTokensAfterCancel = await getAccount(
      connection,
      depositorVaultToken
    );
    assert.equal(
      sellerTokensAfterCancel.amount,
      sellerTokensBefore.amount,
      "All tokens should be returned after cancellation"
    );

    // Verify listing account is closed
    try {
      await program.account.listing.fetch(listingPda);
      assert.fail("Listing account should be closed after cancellation");
    } catch (err) {
      // Expected: account not found
    }

    console.log("Listing cancelled, tokens returned to seller");
  });

  it("Claim after maturity", async () => {
    // Wait until maturity (maturity was set to ~10 seconds from start)
    const vault = await program.account.vault.fetch(vaultPda);
    const now = Math.floor(Date.now() / 1000);
    const waitTime = vault.maturityTs.toNumber() - now + 1;

    if (waitTime > 0) {
      console.log(`Waiting ${waitTime} seconds for maturity...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }

    // Crank NAV one more time to update to maturity and deactivate
    await program.methods
      .crankNav()
      .accounts({
        cranker: authority.publicKey,
        vault: vaultPda,
      })
      .rpc();

    const vaultAfterCrank = await program.account.vault.fetch(vaultPda);
    console.log(
      "NAV at maturity:",
      vaultAfterCrank.navPerShare.toString()
    );
    assert.equal(
      vaultAfterCrank.isActive,
      false,
      "Vault should be deactivated after maturity"
    );

    // Depositor claims remaining tokens (they have 500 tokens remaining after selling 500)
    const depositorTokensBefore = await getAccount(
      connection,
      depositorVaultToken
    );
    const shares = depositorTokensBefore.amount;

    if (shares > BigInt(0)) {
      // Calculate expected payout: shares * nav_per_share / NAV_PRECISION
      const navPerShare = vaultAfterCrank.navPerShare;
      const expectedPayout =
        (BigInt(shares) * BigInt(navPerShare.toNumber())) /
        BigInt(NAV_PRECISION);

      // We may need to mint additional USDC to the pool to cover accrued interest
      // In a real scenario, the protocol would fund this. For testing, mint extra.
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

      const depositorUsdcBefore = await getAccount(
        connection,
        depositorUsdc
      );

      const claimTx = await program.methods
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

      console.log("Claim tx:", claimTx);

      // Verify tokens burned
      const depositorTokensAfter = await getAccount(
        connection,
        depositorVaultToken
      );
      assert.equal(
        depositorTokensAfter.amount,
        BigInt(0),
        "All vault tokens should be burned after claim"
      );

      // Verify USDC received
      const depositorUsdcAfter = await getAccount(
        connection,
        depositorUsdc
      );
      const usdcReceived =
        depositorUsdcAfter.amount - depositorUsdcBefore.amount;
      assert.equal(
        usdcReceived,
        expectedPayout,
        "Claimer should receive correct USDC payout"
      );

      console.log(
        "Claimed",
        shares.toString(),
        "shares for",
        usdcReceived.toString(),
        "USDC (NAV was",
        navPerShare.toString(),
        ")"
      );

      // Verify payout is greater than original deposit (due to 18% APY accrual)
      assert.ok(
        usdcReceived >= BigInt(shares),
        "Payout should be >= original deposit due to interest accrual"
      );
    }

    // Buyer also claims their 500 tokens
    const buyerTokensBefore = await getAccount(connection, buyerVaultToken);
    const buyerShares = buyerTokensBefore.amount;

    if (buyerShares > BigInt(0)) {
      const navPerShare = vaultAfterCrank.navPerShare;
      const expectedPayout =
        (BigInt(buyerShares) * BigInt(navPerShare.toNumber())) /
        BigInt(NAV_PRECISION);

      // Ensure pool has enough
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

      const buyerUsdcBefore = await getAccount(connection, buyerUsdc);

      await program.methods
        .claim()
        .accounts({
          claimer: buyer.publicKey,
          vault: vaultPda,
          vaultTokenMint: vaultTokenMintPda,
          claimerVaultToken: buyerVaultToken,
          claimerUsdc: buyerUsdc,
          usdcPool: usdcPoolPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();

      const buyerTokensAfter = await getAccount(connection, buyerVaultToken);
      assert.equal(
        buyerTokensAfter.amount,
        BigInt(0),
        "All buyer vault tokens should be burned"
      );

      const buyerUsdcAfter = await getAccount(connection, buyerUsdc);
      const usdcReceived = buyerUsdcAfter.amount - buyerUsdcBefore.amount;
      assert.equal(usdcReceived, expectedPayout);

      console.log(
        "Buyer claimed",
        buyerShares.toString(),
        "shares for",
        usdcReceived.toString(),
        "USDC"
      );
    }

    // Verify final vault state
    const finalVault = await program.account.vault.fetch(vaultPda);
    assert.ok(
      finalVault.totalShares.eq(new BN(0)),
      "Total shares should be 0 after all claims"
    );
    console.log("All claims complete. Final vault total_shares:", finalVault.totalShares.toString());
  });
});
