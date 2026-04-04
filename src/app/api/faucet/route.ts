import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
} from "@solana/spl-token";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const USDC_MINT = process.env.USDC_MINT || "";
const ADMIN_KEYPAIR_B64 = process.env.ADMIN_KEYPAIR_B64 || "";

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

    if (!ADMIN_KEYPAIR_B64 || !USDC_MINT) {
      return NextResponse.json({ error: "Faucet not configured" }, { status: 500 });
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

    // Airdrop SOL for tx fees (devnet only)
    try {
      const sig = await connection.requestAirdrop(recipient, 0.5 * 1e9);
      await connection.confirmTransaction(sig, "confirmed");
    } catch {
      // Airdrop may fail due to rate limits, continue anyway
    }

    // Create USDC ATA and mint 10,000 USDC
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      admin,
      usdcMint,
      recipient
    );

    const amount = 10_000 * 1_000_000; // 10,000 USDC
    await mintTo(connection, admin, usdcMint, ata.address, admin.publicKey, amount);

    rateLimitMap.set(address, now);

    return NextResponse.json({
      success: true,
      message: "10,000 test USDC sent!",
      usdcAccount: ata.address.toBase58(),
      solAirdropped: true,
    });
  } catch (err: any) {
    console.error("Faucet error:", err);
    return NextResponse.json(
      { error: err.message || "Faucet failed" },
      { status: 500 }
    );
  }
}
