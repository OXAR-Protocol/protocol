/**
 * Generate OXAR early-access keys.
 *
 *   Usage:
 *     npx ts-node scripts/generate-access-keys.ts [count]
 *
 *   Default count = 10.
 *
 *   Prints plain keys + invite URLs to stdout. Inserts only sha256 hashes
 *   into the access_keys table — plain text never leaves this process.
 *
 * Requires env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ACCESS_INVITE_BASE_URL (optional — default https://app.oxar.app/gate)
 */

import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

// Readable alphabet — no O/0/I/1/L to avoid ambiguity.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomGroup(len = 4): string {
  let out = "";
  const bytes = randomBytes(len);
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

function newKey(): string {
  return `OXAR-${randomGroup()}-${randomGroup()}-${randomGroup()}`;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function main() {
  const count = Math.max(1, Math.min(500, Number(process.argv[2] ?? 10)));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = process.env.ACCESS_INVITE_BASE_URL ?? "https://app.oxar.app/gate";
  if (!url || !svc) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, svc, { auth: { persistSession: false } });

  const rows: { key: string; hash: string }[] = [];
  while (rows.length < count) {
    const key = newKey();
    const hash = hashKey(key);
    if (!rows.find((r) => r.hash === hash)) rows.push({ key, hash });
  }

  const { error } = await supabase
    .from("access_keys")
    .insert(rows.map((r) => ({ key_hash: r.hash })));
  if (error) {
    console.error("Failed to insert keys:", error.message);
    process.exit(1);
  }

  console.log(`\nGenerated ${rows.length} keys. SAVE THIS LIST — it will not be shown again.\n`);
  for (const r of rows) {
    console.log(`${r.key}   ${base}?k=${r.key}`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
