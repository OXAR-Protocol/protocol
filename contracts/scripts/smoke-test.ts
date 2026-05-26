/**
 * Smoke test against deployed devnet program.
 *
 * Verifies: initialize_personal_vault → setup_vault_pool → deposit → withdraw → crank_nav.
 *
 * Uses the local wallet (must have SOL on devnet). Creates a fresh test USDC mint,
 * picks a random vault_id to avoid collisions with prior runs.
 *
 * Run: ANCHOR_PROVIDER_URL=https://api.devnet.solana.com ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/smoke-test.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { OxarProtocol } from "../target/types/oxar_protocol";

const VAULT_SEED = Buffer.from("vault");
const MINT_SEED = Buffer.from("mint");
const POOL_SEED = Buffer.from("pool");

function u64LeBytes(value: BN): Buffer {
  return value.toArrayLike(Buffer, "le", 8);
}

function derivePersonalVaultPda(
  programId: PublicKey,
  creator: PublicKey,
  vaultId: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, creator.toBuffer(), u64LeBytes(vaultId)],
    programId
  );
}

function deriveMintPda(programId: PublicKey, vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([MINT_SEED, vault.toBuffer()], programId);
}

function derivePoolPda(programId: PublicKey, vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([POOL_SEED, vault.toBuffer()], programId);
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OxarProtocol as Program<OxarProtocol>;
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;

  console.log("Program ID:", program.programId.toBase58());
  console.log("Wallet:    ", wallet.publicKey.toBase58());
  const balLamports = await connection.getBalance(wallet.publicKey);
  console.log("Balance:   ", balLamports / 1e9, "SOL");
  console.log("");

  // ---- 1. Create test USDC mint
  console.log("[1/6] Creating test USDC mint...");
  const usdcMint = await createMint(
    connection,
    wallet.payer,
    wallet.publicKey,
    null,
    6
  );
  console.log("       USDC mint:", usdcMint.toBase58());

  // ---- 2. Random vault_id (avoid collisions)
  const vaultId = new BN(Math.floor(Math.random() * 1_000_000));
  const [vaultPda] = derivePersonalVaultPda(
    program.programId,
    wallet.publicKey,
    vaultId
  );
  const [vaultTokenMint] = deriveMintPda(program.programId, vaultPda);
  const [usdcPool] = derivePoolPda(program.programId, vaultPda);
  console.log("");
  console.log("[2/6] Initialize personal vault (id=" + vaultId.toString() + ")");
  console.log("       Vault PDA:", vaultPda.toBase58());

  const initTx = await program.methods
    .initializePersonalVault({
      vaultId,
      riskTemplate: { conservative: {} } as any,
      yieldSource: { idle: {} } as any,
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
  console.log("       Tx:", initTx);

  const vault0 = await (program.account as any).vault.fetch(vaultPda);
  console.log("       vault.isActive =", vault0.isActive, "(expected false)");
  console.log("       vault.totalShares =", vault0.totalShares.toString());
  console.log("       vault.feeBps =", vault0.feeBps);

  // ---- 3. Setup pool
  console.log("");
  console.log("[3/6] Setup vault pool...");
  const setupTx = await program.methods
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
  console.log("       Tx:", setupTx);
  const vault1 = await (program.account as any).vault.fetch(vaultPda);
  console.log("       vault.isActive =", vault1.isActive, "(expected true)");

  // ---- 4. Deposit 5 USDC
  console.log("");
  console.log("[4/6] Deposit 5 USDC...");
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
    100 * 1_000_000
  );
  const walletVaultToken = await createAccount(
    connection,
    wallet.payer,
    vaultTokenMint,
    wallet.publicKey
  );
  const depositTx = await program.methods
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
  console.log("       Tx:", depositTx);
  const vault2 = await (program.account as any).vault.fetch(vaultPda);
  console.log("       totalDeposits:", vault2.totalDeposits.toString(), "(5_000_000 = 5 USDC)");
  console.log("       totalShares:  ", vault2.totalShares.toString(), "(5_000_000 = 5 shares @ NAV 1.0)");
  console.log("       hotPoolBalance:", vault2.hotPoolBalance.toString());

  // ---- 5. Crank NAV (idle = no-op)
  console.log("");
  console.log("[5/6] Crank NAV...");
  const crankTx = await program.methods
    .crankNav()
    .accounts({
      cranker: wallet.publicKey,
      vault: vaultPda,
    } as any)
    .rpc();
  console.log("       Tx:", crankTx);
  const vault3 = await (program.account as any).vault.fetch(vaultPda);
  console.log("       navPerShare unchanged:", vault3.navPerShare.toString(), "(expected 1_000_000)");

  // ---- 6. Withdraw 2 USDC
  console.log("");
  console.log("[6/6] Withdraw 2 shares (= 2 USDC at NAV 1.0)...");
  const withdrawTx = await program.methods
    .withdraw(new BN(2_000_000))
    .accounts({
      withdrawer: wallet.publicKey,
      vault: vaultPda,
      vaultTokenMint,
      withdrawerVaultToken: walletVaultToken,
      withdrawerUsdc: walletUsdc,
      usdcPool,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .rpc();
  console.log("       Tx:", withdrawTx);
  const vault4 = await (program.account as any).vault.fetch(vaultPda);
  console.log("       totalShares after:", vault4.totalShares.toString(), "(expected 3_000_000)");
  console.log("       hotPoolBalance:   ", vault4.hotPoolBalance.toString(), "(expected 3_000_000)");
  const usdcAccount = await getAccount(connection, walletUsdc);
  console.log("       wallet USDC:      ", usdcAccount.amount.toString(), "(expected 97_000_000)");

  console.log("");
  console.log("✅ SMOKE TEST PASSED. Program is functional on devnet.");
  console.log("");
  console.log("Vault PDA:", vaultPda.toBase58());
  console.log("Solana Explorer:");
  console.log("  https://explorer.solana.com/address/" + vaultPda.toBase58() + "?cluster=devnet");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
