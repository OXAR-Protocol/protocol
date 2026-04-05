import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

import { RPC_URL, CURRENT_USDC_MINT } from "@/lib/constants";

const USDC_MINT = (process.env.USDC_MINT || CURRENT_USDC_MINT).trim();
const ADMIN_KEYPAIR_B64 = (process.env.ADMIN_KEYPAIR_B64 || "").trim();

// Rate limiting: 1 request per address per 5 minutes
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000;

function getAdminKeypair(): Keypair {
  const decoded = JSON.parse(Buffer.from(ADMIN_KEYPAIR_B64, "base64").toString());
  return Keypair.fromSecretKey(Uint8Array.from(decoded));
}

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    // Validate Solana address (base58, not Ethereum hex)
    if (address.startsWith("0x") || address.length < 32 || address.length > 44) {
      return NextResponse.json({ error: "Invalid Solana address. Make sure your Solana wallet is connected." }, { status: 400 });
    }

    if (!ADMIN_KEYPAIR_B64) {
      return NextResponse.json({ error: "Faucet not configured: missing ADMIN_KEYPAIR_B64" }, { status: 500 });
    }

    // Rate limit check
    const now = Date.now();
    const lastRequest = rateLimitMap.get(address);
    if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastRequest)) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Try again in ${waitSec}s` },
        { status: 429 }
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const admin = getAdminKeypair();
    const recipient = new PublicKey(address);
    const usdcMint = new PublicKey(USDC_MINT);

    // Send SOL for transaction fees if recipient has none
    try {
      const recipientBalance = await connection.getBalance(recipient);
      if (recipientBalance < 0.1 * 1e9) {
        const { SystemProgram, Transaction: SolTx, sendAndConfirmTransaction } = await import("@solana/web3.js");
        const solTx = new SolTx().add(
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: recipient,
            lamports: 0.5 * 1e9, // 0.5 SOL
          })
        );
        await sendAndConfirmTransaction(connection, solTx, [admin]);
      }
    } catch (e: any) {
      console.log("SOL transfer failed (non-critical):", e.message);
    }

    // Create USDC ATA and mint
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      admin,
      usdcMint,
      recipient
    );

    const mintAmount = 10_000 * 1_000_000; // 10,000 USDC
    await mintTo(connection, admin, usdcMint, ata.address, admin.publicKey, mintAmount);

    rateLimitMap.set(address, Date.now());

    return NextResponse.json({
      success: true,
      message: "10,000 test USDC sent!",
      usdcAccount: ata.address.toBase58(),
    });
  } catch (err: any) {
    console.error("Faucet error:", err);
    console.error("Faucet debug info:", {
      hasKeypair: !!ADMIN_KEYPAIR_B64,
      keypairLen: ADMIN_KEYPAIR_B64.length,
      usdcMint: USDC_MINT,
      rpcUrl: RPC_URL.substring(0, 40),
    });
    return NextResponse.json(
      { error: err.message || "Faucet failed" },
      { status: 500 }
    );
  }
}
