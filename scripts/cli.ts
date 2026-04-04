import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { OxarProtocol } from "../target/types/oxar_protocol";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ─── Config ────────────────────────────────────────────────
const VAULT_SEED = Buffer.from("vault");
const MINT_SEED = Buffer.from("mint");
const POOL_SEED = Buffer.from("pool");
const LISTING_SEED = Buffer.from("listing");
const ESCROW_SEED = Buffer.from("escrow");

// ─── State ─────────────────────────────────────────────────
let provider: anchor.AnchorProvider;
let program: Program<OxarProtocol>;
let connection: Connection;
let authority: anchor.Wallet;
let usdcMint: PublicKey;

// Users
let user1: Keypair;
let user2: Keypair;

// Vault registry
interface VaultInfo {
  pda: PublicKey;
  mintPda: PublicKey;
  poolPda: PublicKey;
  region: string;
  denomination: string;
  subtype: string;
  apyBps: number;
}
const vaults: Map<string, VaultInfo> = new Map();

// ─── Helpers ───────────────────────────────────────────────
function deriveVaultPda(region: string, denom: string, subtype: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, Buffer.from(region), Buffer.from(denom), Buffer.from(subtype)],
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

function deriveListingPda(vault: PublicKey, seller: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [LISTING_SEED, vault.toBuffer(), seller.toBuffer()],
    program.programId
  );
}

function deriveEscrowPda(vault: PublicKey, seller: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [ESCROW_SEED, vault.toBuffer(), seller.toBuffer()],
    program.programId
  );
}

function vaultName(v: VaultInfo): string {
  return `ox${v.region}-${v.denomination}-${v.subtype}`;
}

function formatUsdc(amount: number | BN): string {
  const n = typeof amount === "number" ? amount : amount.toNumber();
  return `$${(n / 1_000_000).toFixed(2)}`;
}

function log(msg: string) {
  console.log(`  ${msg}`);
}

// ─── Commands ──────────────────────────────────────────────

async function cmdSetup() {
  console.log("\n🔧 Setting up environment...\n");

  // Airdrop SOL
  user1 = Keypair.generate();
  user2 = Keypair.generate();

  for (const [name, kp] of [["Authority", authority.payer], ["User1", user1], ["User2", user2]] as [string, Keypair][]) {
    const sig = await connection.requestAirdrop(kp.publicKey, 10 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    log(`${name}: ${kp.publicKey.toBase58()} (10 SOL)`);
  }

  // Create USDC mint
  usdcMint = await createMint(connection, authority.payer, authority.publicKey, null, 6);
  log(`USDC Mint: ${usdcMint.toBase58()}`);

  // Mint USDC to users
  for (const [name, kp] of [["User1", user1], ["User2", user2]] as [string, Keypair][]) {
    const ata = await getOrCreateAssociatedTokenAccount(connection, authority.payer, usdcMint, kp.publicKey);
    await mintTo(connection, authority.payer, usdcMint, ata.address, authority.publicKey, 100_000_000_000); // 100,000 USDC
    log(`${name} USDC account: ${ata.address.toBase58()} (100,000 USDC)`);
  }

  console.log("\n✅ Setup complete!\n");
}

async function cmdCreateVault(region: string, denom: string, subtype: string, apyBps: number, maturityMinutes: number) {
  console.log(`\n🏗️  Creating vault: ${region}/${denom}/${subtype} (APY: ${apyBps / 100}%, maturity: ${maturityMinutes}min)...\n`);

  const [vaultPda] = deriveVaultPda(region, denom, subtype);
  const [mintPda] = deriveMintPda(vaultPda);
  const [poolPda] = derivePoolPda(vaultPda);

  const maturityTs = new BN(Math.floor(Date.now() / 1000) + maturityMinutes * 60);

  // Step 1: initialize_vault
  await program.methods
    .initializeVault({
      assetClass: "GOVT_BOND",
      region,
      denomination: denom,
      assetSubtype: subtype,
      apyBps: new BN(apyBps),
      maturityTs,
      feeBps: 30,
    })
    .accounts({
      authority: authority.publicKey,
      vault: vaultPda,
      usdcMint,
      vaultTokenMint: mintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  log("Step 1/2: Vault + Mint created");

  // Step 2: setup_vault_pool
  const treasury = authority.publicKey; // fees go to authority for now
  await program.methods
    .setupVaultPool()
    .accounts({
      authority: authority.publicKey,
      vault: vaultPda,
      usdcMint,
      usdcPool: poolPda,
      treasury,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  log("Step 2/2: Pool created, vault active");

  const info: VaultInfo = { pda: vaultPda, mintPda, poolPda, region, denomination: denom, subtype, apyBps };
  vaults.set(`${region}-${denom}-${subtype}`, info);

  console.log(`\n✅ Vault ${vaultName(info)} created at ${vaultPda.toBase58()}\n`);
}

async function cmdCreateAllVaults() {
  const configs = [
    { region: "UA", denom: "UAH", subtype: "SHORT", apy: 1800, min: 5 },
    { region: "UA", denom: "UAH", subtype: "MID", apy: 1700, min: 5 },
    { region: "UA", denom: "USD", subtype: "STD", apy: 400, min: 5 },
    { region: "UA", denom: "EUR", subtype: "STD", apy: 350, min: 5 },
    { region: "UA", denom: "UAH", subtype: "WAR", apy: 1800, min: 5 },
    { region: "UA", denom: "USD", subtype: "WAR", apy: 400, min: 5 },
  ];

  for (const c of configs) {
    await cmdCreateVault(c.region, c.denom, c.subtype, c.apy, c.min);
  }
}

async function cmdListVaults() {
  console.log("\n📊 Active Vaults:\n");
  console.log("  Name              | APY     | NAV       | Deposits    | Shares      | Maturity");
  console.log("  ──────────────────|─────────|───────────|─────────────|─────────────|─────────────");

  for (const [key, info] of vaults) {
    try {
      const vault = await program.account.vault.fetch(info.pda);
      const matDate = new Date(vault.maturityTs.toNumber() * 1000);
      const timeLeft = Math.max(0, Math.floor((matDate.getTime() - Date.now()) / 1000));
      console.log(
        `  ${vaultName(info).padEnd(18)}| ${(vault.apyBps.toNumber() / 100).toFixed(1).padStart(5)}%  | ${formatUsdc(vault.navPerShare).padStart(9)} | ${formatUsdc(vault.totalDeposits).padStart(11)} | ${vault.totalShares.toString().padStart(11)} | ${timeLeft}s left`
      );
    } catch {
      console.log(`  ${key}: error fetching`);
    }
  }
  console.log();
}

async function cmdDeposit(vaultKey: string, userIdx: number, amount: number) {
  const info = vaults.get(vaultKey);
  if (!info) { console.log("❌ Vault not found. Use 'vaults' to see available."); return; }

  const user = userIdx === 1 ? user1 : user2;
  const userName = `User${userIdx}`;
  const amountLamports = amount * 1_000_000;

  console.log(`\n💰 ${userName} depositing ${amount} USDC into ${vaultName(info)}...\n`);

  // Get or create user's vault token account
  const userUsdc = await getOrCreateAssociatedTokenAccount(connection, authority.payer, usdcMint, user.publicKey);
  const userVaultToken = await getOrCreateAssociatedTokenAccount(connection, authority.payer, info.mintPda, user.publicKey);

  const tx = await program.methods
    .deposit(new BN(amountLamports))
    .accounts({
      depositor: user.publicKey,
      vault: info.pda,
      usdcMint,
      depositorUsdc: userUsdc.address,
      usdcPool: info.poolPda,
      vaultTokenMint: info.mintPda,
      depositorVaultToken: userVaultToken.address,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([user])
    .rpc();

  const tokenAccount = await getAccount(connection, userVaultToken.address);
  log(`TX: ${tx}`);
  log(`${userName} now has ${Number(tokenAccount.amount)} vault tokens`);
  console.log(`\n✅ Deposit complete!\n`);
}

async function cmdCrankNav(vaultKey: string) {
  const info = vaults.get(vaultKey);
  if (!info) { console.log("❌ Vault not found."); return; }

  console.log(`\n⚙️  Cranking NAV for ${vaultName(info)}...\n`);

  const before = await program.account.vault.fetch(info.pda);

  await program.methods
    .crankNav()
    .accounts({
      cranker: authority.publicKey,
      vault: info.pda,
    })
    .rpc();

  const after = await program.account.vault.fetch(info.pda);
  log(`NAV: ${formatUsdc(before.navPerShare)} → ${formatUsdc(after.navPerShare)}`);
  console.log(`\n✅ NAV updated!\n`);
}

async function cmdCreateListing(vaultKey: string, userIdx: number, amount: number, price: number) {
  const info = vaults.get(vaultKey);
  if (!info) { console.log("❌ Vault not found."); return; }

  const user = userIdx === 1 ? user1 : user2;
  const userName = `User${userIdx}`;
  const amountLamports = amount * 1_000_000;
  const priceLamports = Math.floor(price * 1_000_000);

  console.log(`\n🏷️  ${userName} listing ${amount} tokens at $${price} each from ${vaultName(info)}...\n`);

  const [listingPda] = deriveListingPda(info.pda, user.publicKey);
  const [escrowPda] = deriveEscrowPda(info.pda, user.publicKey);
  const userVaultToken = await getOrCreateAssociatedTokenAccount(connection, authority.payer, info.mintPda, user.publicKey);

  const tx = await program.methods
    .createListing(new BN(amountLamports), new BN(priceLamports))
    .accounts({
      seller: user.publicKey,
      vault: info.pda,
      listing: listingPda,
      sellerVaultToken: userVaultToken.address,
      escrowTokenAccount: escrowPda,
      vaultTokenMint: info.mintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([user])
    .rpc();

  log(`TX: ${tx}`);
  log(`Listing: ${listingPda.toBase58()}`);
  console.log(`\n✅ Listing created! ${amount} tokens at $${price} each = $${(amount * price).toFixed(2)} total\n`);
}

async function cmdBuyListing(vaultKey: string, sellerIdx: number, buyerIdx: number) {
  const info = vaults.get(vaultKey);
  if (!info) { console.log("❌ Vault not found."); return; }

  const seller = sellerIdx === 1 ? user1 : user2;
  const buyerKp = buyerIdx === 1 ? user1 : user2;

  console.log(`\n🛒 User${buyerIdx} buying listing from User${sellerIdx} on ${vaultName(info)}...\n`);

  const [listingPda] = deriveListingPda(info.pda, seller.publicKey);
  const [escrowPda] = deriveEscrowPda(info.pda, seller.publicKey);

  const buyerUsdc = await getOrCreateAssociatedTokenAccount(connection, authority.payer, usdcMint, buyerKp.publicKey);
  const sellerUsdc = await getOrCreateAssociatedTokenAccount(connection, authority.payer, usdcMint, seller.publicKey);
  const buyerVaultToken = await getOrCreateAssociatedTokenAccount(connection, authority.payer, info.mintPda, buyerKp.publicKey);

  const listing = await program.account.listing.fetch(listingPda);

  const tx = await program.methods
    .buyListing()
    .accounts({
      buyer: buyerKp.publicKey,
      vault: info.pda,
      listing: listingPda,
      seller: seller.publicKey,
      buyerUsdc: buyerUsdc.address,
      sellerUsdc: sellerUsdc.address,
      buyerVaultToken: buyerVaultToken.address,
      escrowTokenAccount: escrowPda,
      vaultTokenMint: info.mintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([buyerKp])
    .rpc();

  const totalCost = listing.amount.toNumber() * listing.pricePerToken.toNumber() / 1_000_000;
  log(`TX: ${tx}`);
  log(`Bought ${listing.amount.toNumber() / 1_000_000} tokens for ${formatUsdc(totalCost)}`);
  console.log(`\n✅ Purchase complete!\n`);
}

async function cmdCancelListing(vaultKey: string, userIdx: number) {
  const info = vaults.get(vaultKey);
  if (!info) { console.log("❌ Vault not found."); return; }

  const user = userIdx === 1 ? user1 : user2;

  console.log(`\n❌ User${userIdx} cancelling listing on ${vaultName(info)}...\n`);

  const [listingPda] = deriveListingPda(info.pda, user.publicKey);
  const [escrowPda] = deriveEscrowPda(info.pda, user.publicKey);
  const userVaultToken = await getOrCreateAssociatedTokenAccount(connection, authority.payer, info.mintPda, user.publicKey);

  const tx = await program.methods
    .cancelListing()
    .accounts({
      seller: user.publicKey,
      vault: info.pda,
      listing: listingPda,
      sellerVaultToken: userVaultToken.address,
      escrowTokenAccount: escrowPda,
      vaultTokenMint: info.mintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([user])
    .rpc();

  log(`TX: ${tx}`);
  console.log(`\n✅ Listing cancelled, tokens returned!\n`);
}

async function cmdClaim(vaultKey: string, userIdx: number) {
  const info = vaults.get(vaultKey);
  if (!info) { console.log("❌ Vault not found."); return; }

  const user = userIdx === 1 ? user1 : user2;

  console.log(`\n🎯 User${userIdx} claiming from ${vaultName(info)}...\n`);

  const userVaultToken = await getOrCreateAssociatedTokenAccount(connection, authority.payer, info.mintPda, user.publicKey);
  const userUsdc = await getOrCreateAssociatedTokenAccount(connection, authority.payer, usdcMint, user.publicKey);

  const balanceBefore = (await getAccount(connection, userUsdc.address)).amount;

  const tx = await program.methods
    .claim()
    .accounts({
      claimer: user.publicKey,
      vault: info.pda,
      claimerVaultToken: userVaultToken.address,
      claimerUsdc: userUsdc.address,
      usdcPool: info.poolPda,
      vaultTokenMint: info.mintPda,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([user])
    .rpc();

  const balanceAfter = (await getAccount(connection, userUsdc.address)).amount;
  const received = Number(balanceAfter) - Number(balanceBefore);

  log(`TX: ${tx}`);
  log(`Received: ${formatUsdc(received)}`);
  console.log(`\n✅ Claim complete!\n`);
}

async function cmdBalances() {
  console.log("\n💳 Balances:\n");

  for (const [name, kp] of [["User1", user1], ["User2", user2]] as [string, Keypair][]) {
    if (!kp) continue;
    const sol = await connection.getBalance(kp.publicKey);
    const usdcAta = await getOrCreateAssociatedTokenAccount(connection, authority.payer, usdcMint, kp.publicKey);
    const usdcBal = (await getAccount(connection, usdcAta.address)).amount;

    console.log(`  ${name} (${kp.publicKey.toBase58().slice(0, 8)}...)`);
    console.log(`    SOL: ${(sol / LAMPORTS_PER_SOL).toFixed(2)}`);
    console.log(`    USDC: ${formatUsdc(Number(usdcBal))}`);

    for (const [key, info] of vaults) {
      try {
        const vaultTokenAta = await getOrCreateAssociatedTokenAccount(connection, authority.payer, info.mintPda, kp.publicKey);
        const bal = (await getAccount(connection, vaultTokenAta.address)).amount;
        if (Number(bal) > 0) {
          console.log(`    ${vaultName(info)}: ${Number(bal) / 1_000_000} tokens`);
        }
      } catch {}
    }
  }
  console.log();
}

async function cmdFaucet(address: string, amount: number) {
  if (!usdcMint) { console.log("❌ Run 'setup' first"); return; }

  const recipient = new PublicKey(address);
  const amountLamports = amount * 1_000_000;

  console.log(`\n💧 Sending ${amount} test USDC + 2 SOL to ${address}...\n`);

  // Airdrop SOL for tx fees
  const sig = await connection.requestAirdrop(recipient, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig);
  log(`Airdropped 2 SOL`);

  // Create USDC account and mint
  const ata = await getOrCreateAssociatedTokenAccount(connection, authority.payer, usdcMint, recipient);
  await mintTo(connection, authority.payer, usdcMint, ata.address, authority.publicKey, amountLamports);
  log(`Minted ${amount} USDC to ${ata.address.toBase58()}`);
  log(`USDC Mint: ${usdcMint.toBase58()}`);

  console.log(`\n✅ Faucet complete! ${address} now has ${amount} USDC + 2 SOL\n`);
}

function printHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    OXAR Protocol CLI                         ║
╚══════════════════════════════════════════════════════════════╝

Commands:
  setup                              Setup environment (wallets, USDC)
  create-all                         Create all 6 Ukraine vaults
  create <region> <denom> <sub> <apy> <min>  Create single vault
  vaults                             List all vaults
  balances                           Show user balances

  deposit <vault> <user> <amount>    Deposit USDC (vault: UA-UAH-SHORT, user: 1 or 2)
  crank <vault>                      Update NAV
  claim <vault> <user>               Claim after maturity

  faucet <address> <amount>            Send test USDC + SOL to any address

  list <vault> <user> <amount> <price>  Create listing
  buy <vault> <seller> <buyer>          Buy listing
  cancel <vault> <user>                 Cancel listing

  help                               Show this help
  exit                               Quit

Vault keys: UA-UAH-SHORT, UA-UAH-MID, UA-USD-STD, UA-EUR-STD, UA-UAH-WAR, UA-USD-WAR
`);
}

// ─── Main ──────────────────────────────────────────────────
async function main() {
  provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  connection = provider.connection;
  authority = provider.wallet as anchor.Wallet;

  // Load IDL manually
  const idlPath = path.join(__dirname, "..", "target", "idl", "oxar_protocol.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const programId = new PublicKey(idl.address);
  program = new Program<OxarProtocol>(idl, provider);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              OXAR Protocol — Interactive CLI                  ║
║              Connected to: ${provider.connection.rpcEndpoint.padEnd(30)} ║
╚══════════════════════════════════════════════════════════════╝
`);

  printHelp();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "oxar> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const args = line.trim().split(/\s+/);
    const cmd = args[0];

    try {
      switch (cmd) {
        case "setup":
          await cmdSetup();
          break;
        case "create-all":
          await cmdCreateAllVaults();
          break;
        case "create":
          await cmdCreateVault(args[1], args[2], args[3], parseInt(args[4]), parseInt(args[5]));
          break;
        case "vaults":
          await cmdListVaults();
          break;
        case "balances":
          await cmdBalances();
          break;
        case "deposit":
          await cmdDeposit(args[1], parseInt(args[2]), parseFloat(args[3]));
          break;
        case "crank":
          await cmdCrankNav(args[1]);
          break;
        case "claim":
          await cmdClaim(args[1], parseInt(args[2]));
          break;
        case "list":
          await cmdCreateListing(args[1], parseInt(args[2]), parseFloat(args[3]), parseFloat(args[4]));
          break;
        case "buy":
          await cmdBuyListing(args[1], parseInt(args[2]), parseInt(args[3]));
          break;
        case "cancel":
          await cmdCancelListing(args[1], parseInt(args[2]));
          break;
        case "faucet":
          await cmdFaucet(args[1], parseFloat(args[2]) || 10000);
          break;
        case "help":
          printHelp();
          break;
        case "exit":
        case "quit":
          console.log("Bye!");
          process.exit(0);
        case "":
          break;
        default:
          console.log(`Unknown command: ${cmd}. Type 'help' for commands.`);
      }
    } catch (e: any) {
      console.log(`\n❌ Error: ${e.message || e}\n`);
      if (e.logs) {
        console.log("Logs:", e.logs.slice(-5).join("\n"));
      }
    }

    rl.prompt();
  });
}

main().catch(console.error);
