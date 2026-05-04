// TODO: Replace in-process Map rate limiting with an external KV store (Upstash/Vercel KV) before mainnet — serverless cold starts reset these maps.
import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { RPC_URL } from "@/lib/constants";

const ADMIN_KEYPAIR_B64 = (process.env.ADMIN_KEYPAIR_B64 || "").trim();

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

    if (!address || address.startsWith("0x") || address.length < 32) {
      return NextResponse.json({ error: "Invalid Solana address" }, { status: 400 });
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

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: admin.publicKey,
        toPubkey: recipient,
        lamports: 1 * 1e9, // 1 SOL
      }),
    );

    await sendAndConfirmTransaction(connection, tx, [admin]);

    walletCooldownMap.set(address, now);
    ipCooldownMap.set(clientIp, now);
    if (ipDaily && now - ipDaily.windowStart < DAY_MS) {
      ipDailyCountMap.set(clientIp, { count: ipDaily.count + 1, windowStart: ipDaily.windowStart });
    } else {
      ipDailyCountMap.set(clientIp, { count: 1, windowStart: now });
    }

    return NextResponse.json({ success: true, message: "1 SOL sent!" });
  } catch (err: unknown) {
    console.error("faucet-sol error:", err);
    return NextResponse.json(
      { error: "Faucet temporarily unavailable" },
      { status: 500 },
    );
  }
}
