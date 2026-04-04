import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { OxarProtocol } from "./types";
import { deriveMintPda, derivePoolPda, deriveListingPda, deriveEscrowPda } from "./pda";

/**
 * Build an unsigned deposit transaction.
 *
 * Derives all needed PDAs, creates the depositor's vault-token ATA if it does
 * not already exist, and assembles the transaction with a recent blockhash.
 */
export async function buildDepositTransaction(
  program: Program<OxarProtocol>,
  connection: Connection,
  depositor: PublicKey,
  vaultPda: PublicKey,
  amount: BN,
): Promise<Transaction> {
  const vaultAccount = await (program.account as any).vault.fetch(vaultPda);
  const usdcMint = vaultAccount.usdcMint as PublicKey;
  const [vaultTokenMint] = deriveMintPda(vaultPda);
  const [usdcPool] = derivePoolPda(vaultPda);

  const depositorUsdc = await getAssociatedTokenAddress(usdcMint, depositor);
  const depositorVaultToken = await getAssociatedTokenAddress(vaultTokenMint, depositor);

  const depositIx = await program.methods
    .deposit(amount)
    .accounts({
      depositor,
      vault: vaultPda,
      vaultTokenMint,
      depositorUsdc,
      depositorVaultToken,
      usdcPool,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .instruction();

  const tx = new Transaction();

  // Create vault token ATA if it does not exist
  const vaultTokenAccountInfo = await connection.getAccountInfo(depositorVaultToken);
  if (!vaultTokenAccountInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        depositor,
        depositorVaultToken,
        depositor,
        vaultTokenMint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      )
    );
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
export async function buildCreateListingTransaction(
  program: Program<OxarProtocol>,
  connection: Connection,
  seller: PublicKey,
  vaultPda: PublicKey,
  amount: BN,
  pricePerToken: BN,
): Promise<Transaction> {
  const [vaultTokenMint] = deriveMintPda(vaultPda);
  const [listing] = deriveListingPda(vaultPda, seller);
  const [escrowTokenAccount] = deriveEscrowPda(vaultPda, seller);

  const sellerVaultToken = await getAssociatedTokenAddress(vaultTokenMint, seller);

  const ix = await program.methods
    .createListing(amount, pricePerToken)
    .accounts({
      seller,
      vault: vaultPda,
      listing,
      vaultTokenMint,
      sellerVaultToken,
      escrowTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .instruction();

  const tx = new Transaction().add(ix);

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
export async function buildBuyListingTransaction(
  program: Program<OxarProtocol>,
  connection: Connection,
  buyer: PublicKey,
  vaultPda: PublicKey,
  sellerPubkey: PublicKey,
): Promise<Transaction> {
  const vaultAccount = await (program.account as any).vault.fetch(vaultPda);
  const usdcMint = vaultAccount.usdcMint as PublicKey;
  const [vaultTokenMint] = deriveMintPda(vaultPda);
  const [listing] = deriveListingPda(vaultPda, sellerPubkey);
  const [escrowTokenAccount] = deriveEscrowPda(vaultPda, sellerPubkey);

  const buyerUsdc = await getAssociatedTokenAddress(usdcMint, buyer);
  const sellerUsdc = await getAssociatedTokenAddress(usdcMint, sellerPubkey);
  const buyerVaultToken = await getAssociatedTokenAddress(vaultTokenMint, buyer);

  const ix = await program.methods
    .buyListing()
    .accounts({
      buyer,
      seller: sellerPubkey,
      vault: vaultPda,
      listing,
      vaultTokenMint,
      buyerUsdc,
      sellerUsdc,
      buyerVaultToken,
      escrowTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .instruction();

  const tx = new Transaction();

  // Create buyer vault token ATA if needed
  const buyerVaultTokenInfo = await connection.getAccountInfo(buyerVaultToken);
  if (!buyerVaultTokenInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        buyer,
        buyerVaultToken,
        buyer,
        vaultTokenMint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      )
    );
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
export async function buildCancelListingTransaction(
  program: Program<OxarProtocol>,
  connection: Connection,
  seller: PublicKey,
  vaultPda: PublicKey,
): Promise<Transaction> {
  const [vaultTokenMint] = deriveMintPda(vaultPda);
  const [listing] = deriveListingPda(vaultPda, seller);
  const [escrowTokenAccount] = deriveEscrowPda(vaultPda, seller);

  const sellerVaultToken = await getAssociatedTokenAddress(vaultTokenMint, seller);

  const ix = await program.methods
    .cancelListing()
    .accounts({
      seller,
      vault: vaultPda,
      listing,
      vaultTokenMint,
      sellerVaultToken,
      escrowTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .instruction();

  const tx = new Transaction().add(ix);

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
export async function buildClaimTransaction(
  program: Program<OxarProtocol>,
  connection: Connection,
  claimer: PublicKey,
  vaultPda: PublicKey,
): Promise<Transaction> {
  const vaultAccount = await (program.account as any).vault.fetch(vaultPda);
  const usdcMint = vaultAccount.usdcMint as PublicKey;
  const [vaultTokenMint] = deriveMintPda(vaultPda);
  const [usdcPool] = derivePoolPda(vaultPda);

  const claimerVaultToken = await getAssociatedTokenAddress(vaultTokenMint, claimer);
  const claimerUsdc = await getAssociatedTokenAddress(usdcMint, claimer);

  const ix = await program.methods
    .claim()
    .accounts({
      claimer,
      vault: vaultPda,
      vaultTokenMint,
      claimerVaultToken,
      claimerUsdc,
      usdcPool,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .instruction();

  const tx = new Transaction().add(ix);

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = claimer;

  return tx;
}
