"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDepositTransaction = buildDepositTransaction;
exports.buildCreateListingTransaction = buildCreateListingTransaction;
exports.buildBuyListingTransaction = buildBuyListingTransaction;
exports.buildCancelListingTransaction = buildCancelListingTransaction;
exports.buildClaimTransaction = buildClaimTransaction;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const pda_1 = require("./pda");
/**
 * Build an unsigned deposit transaction.
 *
 * Derives all needed PDAs, creates the depositor's vault-token ATA if it does
 * not already exist, and assembles the transaction with a recent blockhash.
 */
async function buildDepositTransaction(program, connection, depositor, vaultPda, amount) {
    // SAFETY: Anchor IDL typing is incomplete for dynamic account resolution
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    const usdcMint = vaultAccount.usdcMint;
    const [vaultTokenMint] = (0, pda_1.deriveMintPda)(vaultPda);
    const [usdcPool] = (0, pda_1.derivePoolPda)(vaultPda);
    const depositorUsdc = await (0, spl_token_1.getAssociatedTokenAddress)(usdcMint, depositor);
    const depositorVaultToken = await (0, spl_token_1.getAssociatedTokenAddress)(vaultTokenMint, depositor);
    const depositIx = await program.methods
        .deposit(amount)
        // SAFETY: Anchor IDL typing is incomplete for dynamic account resolution
        .accounts({
        depositor,
        vault: vaultPda,
        vaultTokenMint,
        depositorUsdc,
        depositorVaultToken,
        usdcPool,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
        .instruction();
    const tx = new web3_js_1.Transaction();
    // Create vault token ATA if it does not exist
    const vaultTokenAccountInfo = await connection.getAccountInfo(depositorVaultToken);
    if (!vaultTokenAccountInfo) {
        tx.add((0, spl_token_1.createAssociatedTokenAccountInstruction)(depositor, depositorVaultToken, depositor, vaultTokenMint, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
    }
    tx.add(depositIx);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = depositor;
    return tx;
}
/**
 * Build an unsigned create-listing transaction.
 *
 * Derives listing and escrow PDAs, looks up the seller's vault-token ATA, and
 * assembles the instruction.
 */
async function buildCreateListingTransaction(program, connection, seller, vaultPda, amount, pricePerToken) {
    const [vaultTokenMint] = (0, pda_1.deriveMintPda)(vaultPda);
    const [listing] = (0, pda_1.deriveListingPda)(vaultPda, seller);
    const [escrowTokenAccount] = (0, pda_1.deriveEscrowPda)(vaultPda, seller);
    const sellerVaultToken = await (0, spl_token_1.getAssociatedTokenAddress)(vaultTokenMint, seller);
    const ix = await program.methods
        .createListing(amount, pricePerToken)
        // SAFETY: Anchor IDL typing is incomplete for dynamic account resolution
        .accounts({
        seller,
        vault: vaultPda,
        listing,
        vaultTokenMint,
        sellerVaultToken,
        escrowTokenAccount,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        systemProgram: web3_js_1.SystemProgram.programId,
    })
        .instruction();
    const tx = new web3_js_1.Transaction().add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = seller;
    return tx;
}
/**
 * Build an unsigned buy-listing transaction.
 *
 * Fetches vault data to determine the USDC mint, derives all PDAs, creates the
 * buyer's vault-token ATA if needed, and assembles the instruction.
 */
async function buildBuyListingTransaction(program, connection, buyer, vaultPda, sellerPubkey) {
    // SAFETY: Anchor IDL typing is incomplete for dynamic account resolution
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    const usdcMint = vaultAccount.usdcMint;
    const [vaultTokenMint] = (0, pda_1.deriveMintPda)(vaultPda);
    const [listing] = (0, pda_1.deriveListingPda)(vaultPda, sellerPubkey);
    const [escrowTokenAccount] = (0, pda_1.deriveEscrowPda)(vaultPda, sellerPubkey);
    const buyerUsdc = await (0, spl_token_1.getAssociatedTokenAddress)(usdcMint, buyer);
    const sellerUsdc = await (0, spl_token_1.getAssociatedTokenAddress)(usdcMint, sellerPubkey);
    const buyerVaultToken = await (0, spl_token_1.getAssociatedTokenAddress)(vaultTokenMint, buyer);
    const treasuryUsdc = await (0, spl_token_1.getAssociatedTokenAddress)(usdcMint, vaultAccount.treasury);
    const ix = await program.methods
        .buyListing()
        // SAFETY: Anchor IDL typing is incomplete for dynamic account resolution
        .accounts({
        buyer,
        seller: sellerPubkey,
        vault: vaultPda,
        listing,
        vaultTokenMint,
        buyerUsdc,
        sellerUsdc,
        treasuryUsdc,
        buyerVaultToken,
        escrowTokenAccount,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
        .instruction();
    const tx = new web3_js_1.Transaction();
    // Create buyer vault token ATA if needed
    const buyerVaultTokenInfo = await connection.getAccountInfo(buyerVaultToken);
    if (!buyerVaultTokenInfo) {
        tx.add((0, spl_token_1.createAssociatedTokenAccountInstruction)(buyer, buyerVaultToken, buyer, vaultTokenMint, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
    }
    tx.add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = buyer;
    return tx;
}
/**
 * Build an unsigned cancel-listing transaction.
 *
 * Derives listing and escrow PDAs, looks up the seller's vault-token ATA, and
 * assembles the instruction.
 */
async function buildCancelListingTransaction(program, connection, seller, vaultPda) {
    const [vaultTokenMint] = (0, pda_1.deriveMintPda)(vaultPda);
    const [listing] = (0, pda_1.deriveListingPda)(vaultPda, seller);
    const [escrowTokenAccount] = (0, pda_1.deriveEscrowPda)(vaultPda, seller);
    const sellerVaultToken = await (0, spl_token_1.getAssociatedTokenAddress)(vaultTokenMint, seller);
    const ix = await program.methods
        .cancelListing()
        // SAFETY: Anchor IDL typing is incomplete for dynamic account resolution
        .accounts({
        seller,
        vault: vaultPda,
        listing,
        vaultTokenMint,
        sellerVaultToken,
        escrowTokenAccount,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
        .instruction();
    const tx = new web3_js_1.Transaction().add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = seller;
    return tx;
}
/**
 * Build an unsigned claim transaction.
 *
 * Fetches vault data to determine the USDC mint, derives mint and pool PDAs,
 * looks up the claimer's token ATAs, and assembles the instruction.
 */
async function buildClaimTransaction(program, connection, claimer, vaultPda) {
    // SAFETY: Anchor IDL typing is incomplete for dynamic account resolution
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    const usdcMint = vaultAccount.usdcMint;
    const [vaultTokenMint] = (0, pda_1.deriveMintPda)(vaultPda);
    const [usdcPool] = (0, pda_1.derivePoolPda)(vaultPda);
    const claimerVaultToken = await (0, spl_token_1.getAssociatedTokenAddress)(vaultTokenMint, claimer);
    const claimerUsdc = await (0, spl_token_1.getAssociatedTokenAddress)(usdcMint, claimer);
    const ix = await program.methods
        .claim()
        // SAFETY: Anchor IDL typing is incomplete for dynamic account resolution
        .accounts({
        claimer,
        vault: vaultPda,
        vaultTokenMint,
        claimerVaultToken,
        claimerUsdc,
        usdcPool,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
        .instruction();
    const tx = new web3_js_1.Transaction().add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = claimer;
    return tx;
}
