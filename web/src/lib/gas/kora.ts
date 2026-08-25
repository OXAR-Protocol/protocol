"use client";

/**
 * Client helpers for the Kora gasless relayer, called through our same-origin `/api/kora`
 * proxy (which holds the api-key — never exposed here). Embedded wallets use this so a
 * user with $0 SOL can still transact: Kora co-signs as the fee payer and pays the gas.
 * EVERY transaction goes through Kora — legacy ones we build ourselves and v0 ones
 * from Jupiter/Kamino alike (see `rebuildV0WithKora`). This comment used to say v0
 * swaps stayed on native gas; they haven't for a while.
 */
const PROXY_URL = "/api/kora";

/**
 * The relayer let a basket down after it had already been signed — for the rest of
 * this visit, baskets pay their own gas instead.
 *
 * A basket is signed once, up front, so there is no falling back mid-flight: asking
 * again is a second identical confirmation for a basket the user already approved.
 * The only honest place to react is the NEXT basket, which is what this is for. It
 * doesn't touch single transactions — those still try gasless first and fall back
 * before anything is signed.
 */
let bulkGaslessBroken = false;
export function markBulkGaslessBroken(): void {
  bulkGaslessBroken = true;
}
export function bulkGaslessAvailable(): boolean {
  return koraEnabled() && !bulkGaslessBroken;
}

/** Gated by a public flag so the client knows whether the node is wired without a probe. */
export function koraEnabled(): boolean {
  return process.env.NEXT_PUBLIC_KORA_ENABLED === "1";
}

async function koraRpc<T>(method: string, params?: unknown): Promise<T> {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    throw new Error(json?.error?.message ?? `Kora RPC failed (${res.status})`);
  }
  return json.result as T;
}

/** The fee-payer Kora will co-sign with — set as the transaction's fee payer. */
export async function koraPayer(): Promise<string> {
  const r = await koraRpc<{ signer_address: string }>("getPayerSigner");
  return r.signer_address;
}

/** A recent blockhash from the node's own RPC (kept consistent with what it broadcasts). */
export async function koraBlockhash(): Promise<string> {
  const r = await koraRpc<{ blockhash: string }>("getBlockhash");
  return r.blockhash;
}

/** Hand the user-partial-signed tx to Kora; it adds the fee-payer sig + broadcasts. */
export async function koraSignAndSend(signedTx: Uint8Array): Promise<string> {
  const r = await koraRpc<{ signature: string }>("signAndSendTransaction", {
    transaction: bytesToBase64(signedTx),
  });
  return r.signature;
}

/** Chunked base64 encode — avoids the arg-count limit of String.fromCharCode(...big). */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/**
 * Tell the server why gasless fell back, so the reason survives past the user's own
 * console. Fire-and-forget on purpose: this runs inside a money action, and a report
 * that could delay or break a transaction would be worse than no report at all.
 */
export function reportGaslessFailure(wallet: string, stage: string, error: unknown): void {
  const reason = error instanceof Error ? error.message : String(error);
  try {
    void fetch("/api/gasless-report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wallet, stage, reason }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Reporting must never be the thing that breaks a transaction.
  }
}
