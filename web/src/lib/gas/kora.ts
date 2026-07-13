"use client";

/**
 * Client helpers for the Kora gasless relayer, called through our same-origin `/api/kora`
 * proxy (which holds the api-key — never exposed here). Embedded wallets use this so a
 * user with $0 SOL can still transact: Kora co-signs as the fee payer and pays the gas.
 * Only legacy transactions we build ourselves (deposit/withdraw/send) go through Kora;
 * Jupiter v0 swaps bake in their own payer and stay on native gas.
 */
const PROXY_URL = "/api/kora";

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
