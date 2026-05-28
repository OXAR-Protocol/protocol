import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("AdapterRegistry account", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.OxarProtocol;

  it("initializes empty registry", async () => {
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId,
    );
    await program.methods
      .initializeAdapterRegistry()
      .accounts({ admin: provider.wallet.publicKey, registry: registryPda } as any)
      .rpc();
    const acc = await (program.account as any).adapterRegistry.fetch(registryPda);
    expect(acc.admin.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
    expect(acc.adapterCount).to.equal(0);
  });
});
