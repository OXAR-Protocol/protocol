import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { RPC_URL } from "@/lib/constants";

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

    if (!address || address.startsWith("0x") || address.length < 32) {
      return NextResponse.json({ error: "Invalid Solana address" }, { status: 400 });
    }

    if (!ADMIN_KEYPAIR_B64) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
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

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: admin.publicKey,
        toPubkey: recipient,
        lamports: 1 * 1e9, // 1 SOL
      })
    );

    await sendAndConfirmTransaction(connection, tx, [admin]);

    // Update rate limit after successful transfer
    rateLimitMap.set(address, Date.now());

    return NextResponse.json({
      success: true,
      message: "1 SOL sent!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
