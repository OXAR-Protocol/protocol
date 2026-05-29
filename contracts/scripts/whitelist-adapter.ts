/**
 * Whitelist a yield adapter in the on-chain AdapterRegistry (devnet).
 *
 * Idempotent: if the adapter entry already exists, prints it and exits 0.
 * Defaults to the kamino-adapter; override via env ADAPTER / NAME / VERSION.
 *
 * Run: ANCHOR_PROVIDER_URL=https://api.devnet.solana.com ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/whitelist-adapter.ts
 */
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const ADAPTER = new PublicKey(
  process.env.ADAPTER ?? "FhGXjrzLvpLUCTxbvN85isLpYoQG9TRnDWRTAaPdK2H9",
);
const NAME = process.env.NAME ?? "Kamino USDC";
const VERSION = Number(process.env.VERSION ?? "1");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program =
    anchor.workspace.OxarProtocol ??
    new anchor.Program(require("../target/idl/oxar_protocol.json"), provider);

  const [registry] = PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    program.programId,
  );
  const [adapterEntry] = PublicKey.findProgramAddressSync(
    [Buffer.from("adapter_entry"), ADAPTER.toBuffer()],
    program.programId,
  );

  const existing = await (program.account as any).adapterEntry.fetchNullable(adapterEntry);
  if (existing) {
    console.log("Adapter already whitelisted:");
    console.log("  entry  :", adapterEntry.toBase58());
    console.log("  program:", existing.adapterProgram.toBase58());
    console.log("  name   :", existing.name, "| version:", existing.interfaceVersion, "| active:", existing.isActive);
    return;
  }

  console.log(`Whitelisting "${NAME}" (v${VERSION})`);
  console.log("  adapter:", ADAPTER.toBase58());
  console.log("  entry  :", adapterEntry.toBase58());

  const sig = await program.methods
    .whitelistAdapter(NAME, VERSION)
    .accounts({
      admin: provider.wallet.publicKey,
      registry,
      adapterEntry,
      adapterProgram: ADAPTER,
    } as any)
    .rpc();
  console.log("Done. tx:", sig);

  const fresh = await (program.account as any).adapterEntry.fetch(adapterEntry);
  console.log("  active :", fresh.isActive, "| addedAt:", fresh.addedAt.toString());
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
