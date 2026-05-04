// TODO: Replace in-process Map rate limiting with an external KV store (Upstash/Vercel KV) before mainnet — serverless cold starts reset these maps.
import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

import { RPC_URL, CURRENT_USDC_MINT } from "@/lib/constants";

const USDC_MINT = (process.env.USDC_MINT || CURRENT_USDC_MINT).trim();
const ADMIN_KEYPAIR_B64 = (process.env.ADMIN_KEYPAIR_B64 || "").trim();

// Rate limiting: keyed by wallet address AND client IP, plus daily cap per IP.
const walletCooldownMap = new Map<string, number>();
const ipCooldownMap = new Map<string, number>();
const ipDailyCountMap = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT_MS = 5 * 60 * 1000;
const IP_DAILY_CAP = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function getAdminKeypair(): Keypair {
  try {
    const decoded = JSON.parse(Buffer.from(ADMIN_KEYPAIR_B64, "base64").toString());
    return Keypair.fromSecretKey(Uint8Array.from(decoded));
  } catch {
    throw new Error("ADMIN_KEYPAIR_B64 is invalid or malformed");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    // Validate Solana address (base58, not Ethereum hex)
    if (address.startsWith("0x") || address.length < 32 || address.length > 44) {
      return NextResponse.json(
        { error: "Invalid Solana address. Make sure your Solana wallet is connected." },
        { status: 400 },
      );
    }

    if (!ADMIN_KEYPAIR_B64) {
      return NextResponse.json({ error: "Faucet temporarily unavailable" }, { status: 500 });
    }

    const clientIp = getClientIp(req);
    const now = Date.now();

    const lastWalletRequest = walletCooldownMap.get(address);
    if (lastWalletRequest && now - lastWalletRequest < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastWalletRequest)) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Try again in ${waitSec}s` },
        { status: 429 },
      );
    }

    const lastIpRequest = ipCooldownMap.get(clientIp);
    if (lastIpRequest && now - lastIpRequest < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastIpRequest)) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Try again in ${waitSec}s` },
        { status: 429 },
      );
    }

    const ipDaily = ipDailyCountMap.get(clientIp);
    if (ipDaily && now - ipDaily.windowStart < DAY_MS && ipDaily.count >= IP_DAILY_CAP) {
      return NextResponse.json(
        { error: "Daily limit reached. Try again tomorrow." },
        { status: 429 },
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
        const { SystemProgram, Transaction: SolTx, sendAndConfirmTransaction } = await import(
          "@solana/web3.js"
        );
        const solTx = new SolTx().add(
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: recipient,
            lamports: 0.5 * 1e9, // 0.5 SOL
          }),
        );
        await sendAndConfirmTransaction(connection, solTx, [admin]);
      }
    } catch (e: unknown) {
      console.error("SOL pre-fund failed (non-critical):", e);
    }

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      admin,
      usdcMint,
      recipient,
    );

    const mintAmount = 10_000 * 1_000_000; // 10,000 USDC
    await mintTo(connection, admin, usdcMint, ata.address, admin.publicKey, mintAmount);

    walletCooldownMap.set(address, now);
    ipCooldownMap.set(clientIp, now);
    if (ipDaily && now - ipDaily.windowStart < DAY_MS) {
      ipDailyCountMap.set(clientIp, { count: ipDaily.count + 1, windowStart: ipDaily.windowStart });
    } else {
      ipDailyCountMap.set(clientIp, { count: 1, windowStart: now });
    }

    return NextResponse.json({
      success: true,
      message: "10,000 test USDC sent!",
      usdcAccount: ata.address.toBase58(),
    });
  } catch (err: unknown) {
    console.error("faucet error:", err);
    return NextResponse.json(
      { error: "Faucet temporarily unavailable" },
      { status: 500 },
    );
  }
}
