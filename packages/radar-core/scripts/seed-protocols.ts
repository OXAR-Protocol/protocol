/**
 * Seed `radar.protocols` from the static PROTOCOL_REGISTRY.
 *
 * Idempotent: upsert by slug. Re-run after editing the registry to
 * pick up changes (estimated APY, new protocols, deprecations).
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/seed-protocols.ts
 */

import { createClient } from "@supabase/supabase-js";

import { PROTOCOL_REGISTRY } from "../src/protocols/registry";

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    db: { schema: "radar" },
    auth: { persistSession: false },
  });

  const rows = PROTOCOL_REGISTRY.map((p) => ({
    slug: p.slug,
    name: p.name,
    chain: p.chain,
    category: p.category,
    contract_address: p.contractAddress,
    decimals: p.decimals,
    description: p.description,
    issuer_name: p.issuerName,
    issuer_jurisdiction: p.issuerJurisdiction ?? null,
    website_url: p.websiteUrl,
    estimated_apy_bps: p.estimatedApyBps,
    is_active: true,
  }));

  console.error(`Upserting ${rows.length} protocols...`);

  const { data, error } = await supabase
    .from("protocols")
    .upsert(rows, { onConflict: "slug" })
    .select("slug, chain, name");

  if (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }

  console.error(`Seeded ${data?.length ?? 0} rows.`);
  for (const row of data ?? []) {
    console.error(`  ✓ ${row.slug} (${row.chain}) — ${row.name}`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
