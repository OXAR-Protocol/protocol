import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const RPC_URL = "https://devnet.helius-rpc.com/?api-key=0803f982-c361-4a2a-8496-1391a4b38672";
const ADMIN_KEYPAIR_B64 = (process.env.ADMIN_KEYPAIR_B64 || "").trim();

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

    return NextResponse.json({
      success: true,
      message: "1 SOL sent!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
