/**
 * Initialize AdapterRegistry on devnet.
 *
 * Idempotent: if registry already exists, prints existing state and exits 0.
 *
 * Run: ANCHOR_PROVIDER_URL=https://api.devnet.solana.com ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/init-registry.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.OxarProtocol ?? new anchor.Program(
    require("../target/idl/oxar_protocol.json"),
    provider,
  );

  const [registryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    program.programId,
  );

  // Check existence
  const existing = await (program.account as any).adapterRegistry.fetchNullable(registryPda);
  if (existing) {
    console.log("AdapterRegistry already initialized:");
    console.log("  PDA        :", registryPda.toBase58());
    console.log("  admin      :", existing.admin.toBase58());
    console.log("  adapterCount:", existing.adapterCount);
    return;
  }

  console.log("Initializing AdapterRegistry…");
  console.log("  PDA  :", registryPda.toBase58());
  console.log("  admin:", provider.wallet.publicKey.toBase58());

  const sig = await program.methods
    .initializeAdapterRegistry()
    .accounts({ admin: provider.wallet.publicKey, registry: registryPda } as any)
    .rpc();

  console.log("Done. tx:", sig);

  const fresh = await (program.account as any).adapterRegistry.fetch(registryPda);
  console.log("  admin      :", fresh.admin.toBase58());
  console.log("  adapterCount:", fresh.adapterCount);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
