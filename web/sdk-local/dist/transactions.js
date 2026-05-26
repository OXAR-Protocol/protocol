"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInitializePersonalVaultTransaction = buildInitializePersonalVaultTransaction;
exports.buildDepositTransaction = buildDepositTransaction;
exports.buildWithdrawTransaction = buildWithdrawTransaction;
exports.buildCrankNavTransaction = buildCrankNavTransaction;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const spl_token_1 = require("@solana/spl-token");
const pda_1 = require("./pda");
// ============================================================================
// Personal vault
// ============================================================================
/**
 * Build initialize_personal_vault transaction.
 *
 * Creates a new vault PDA scoped to the creator + vault_id. Anyone can create —
 * no admin gate. The vault is inactive until `setup_vault_pool` runs.
 */
async function buildInitializePersonalVaultTransaction(program, connection, creator, usdcMint, vaultId, params) {
    const [vaultPda] = (0, pda_1.derivePersonalVaultPda)(creator, vaultId);
    const [vaultTokenMint] = (0, pda_1.deriveMintPda)(vaultPda);
    const ix = await program.methods
        .initializePersonalVault({
        vaultId: new anchor_1.BN(vaultId.toString()),
        riskTemplate: params.riskTemplate,
        yieldSource: params.yieldSource,
        feeBps: params.feeBps,
    })
        .accounts({
        creator,
        vault: vaultPda,
        usdcMint,
        vaultTokenMint,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        systemProgram: web3_js_1.SystemProgram.programId,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
    })
        .instruction();
    const tx = new web3_js_1.Transaction().add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = creator;
    return tx;
}
/**
 * Build deposit transaction — works for personal and group vaults.
 *
 * Creates the depositor's vault-token ATA if it does not already exist.
 */
async function buildDepositTransaction(program, connection, depositor, vaultPda, amount) {
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    const usdcMint = vaultAccount.usdcMint;
    const [vaultTokenMint] = (0, pda_1.deriveMintPda)(vaultPda);
    const [usdcPool] = (0, pda_1.derivePoolPda)(vaultPda);
    const depositorUsdc = await (0, spl_token_1.getAssociatedTokenAddress)(usdcMint, depositor);
    const depositorVaultToken = await (0, spl_token_1.getAssociatedTokenAddress)(vaultTokenMint, depositor);
    const ix = await program.methods
        .deposit(amount)
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
    const vaultTokenInfo = await connection.getAccountInfo(depositorVaultToken);
    if (!vaultTokenInfo) {
        tx.add((0, spl_token_1.createAssociatedTokenAccountInstruction)(depositor, depositorVaultToken, depositor, vaultTokenMint, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
    }
    tx.add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = depositor;
    return tx;
}
/**
 * Build withdraw transaction. Burns shares, transfers USDC from hot pool.
 *
 * No maturity check — vaults are perpetual, withdraw anytime.
 */
async function buildWithdrawTransaction(program, connection, withdrawer, vaultPda, shares) {
    const vaultAccount = await program.account.vault.fetch(vaultPda);
    const usdcMint = vaultAccount.usdcMint;
    const [vaultTokenMint] = (0, pda_1.deriveMintPda)(vaultPda);
    const [usdcPool] = (0, pda_1.derivePoolPda)(vaultPda);
    const withdrawerVaultToken = await (0, spl_token_1.getAssociatedTokenAddress)(vaultTokenMint, withdrawer);
    const withdrawerUsdc = await (0, spl_token_1.getAssociatedTokenAddress)(usdcMint, withdrawer);
    const ix = await program.methods
        .withdraw(shares)
        .accounts({
        withdrawer,
        vault: vaultPda,
        vaultTokenMint,
        withdrawerVaultToken,
        withdrawerUsdc,
        usdcPool,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
        .instruction();
    const tx = new web3_js_1.Transaction();
    const usdcAtaInfo = await connection.getAccountInfo(withdrawerUsdc);
    if (!usdcAtaInfo) {
        tx.add((0, spl_token_1.createAssociatedTokenAccountInstruction)(withdrawer, withdrawerUsdc, withdrawer, usdcMint, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID));
    }
    tx.add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = withdrawer;
    return tx;
}
/**
 * Build crank_nav transaction — permissionless NAV update.
 */
async function buildCrankNavTransaction(program, connection, cranker, vaultPda) {
    const ix = await program.methods
        .crankNav()
        .accounts({
        cranker,
        vault: vaultPda,
    })
        .instruction();
    const tx = new web3_js_1.Transaction().add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = cranker;
    return tx;
}
