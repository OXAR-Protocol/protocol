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

  it("admin can whitelist adapter", async () => {
    const dummyAdapter = anchor.web3.Keypair.generate().publicKey;
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId,
    );
    const [entryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("adapter_entry"), dummyAdapter.toBuffer()],
      program.programId,
    );
    await program.methods
      .whitelistAdapter("Dummy Adapter", 1)
      .accounts({
        admin: provider.wallet.publicKey,
        registry: registryPda,
        adapterEntry: entryPda,
        adapterProgram: dummyAdapter,
      } as any)
      .rpc();
    const entry = await (program.account as any).adapterEntry.fetch(entryPda);
    expect(entry.adapterProgram.toBase58()).to.equal(dummyAdapter.toBase58());
    expect(entry.isActive).to.equal(true);
    expect(entry.interfaceVersion).to.equal(1);
    expect(entry.name).to.equal("Dummy Adapter");
    // Registry count incremented
    const registry = await (program.account as any).adapterRegistry.fetch(registryPda);
    expect(registry.adapterCount).to.equal(1);
  });

  it("non-admin cannot whitelist adapter", async () => {
    const stranger = anchor.web3.Keypair.generate();
    const dummyAdapter = anchor.web3.Keypair.generate().publicKey;
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId,
    );
    const [entryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("adapter_entry"), dummyAdapter.toBuffer()],
      program.programId,
    );
    // Fund stranger so signing works
    const sig = await provider.connection.requestAirdrop(stranger.publicKey, 1e9);
    await provider.connection.confirmTransaction(sig);
    try {
      await program.methods
        .whitelistAdapter("Sneaky", 1)
        .accounts({
          admin: stranger.publicKey,
          registry: registryPda,
          adapterEntry: entryPda,
          adapterProgram: dummyAdapter,
        } as any)
        .signers([stranger])
        .rpc();
      throw new Error("Expected unauthorized to fail");
    } catch (err: any) {
      expect(err.toString().toLowerCase()).to.match(/unauthorized|constraint/);
    }
  });

  it("admin can pause adapter", async () => {
    // Re-use adapter from the first whitelist test by re-deriving the same PDA
    // We need a fresh dummyAdapter for isolation
    const adapterToPause = anchor.web3.Keypair.generate().publicKey;
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId,
    );
    const [entryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("adapter_entry"), adapterToPause.toBuffer()],
      program.programId,
    );
    // First whitelist it
    await program.methods
      .whitelistAdapter("ToPause", 1)
      .accounts({
        admin: provider.wallet.publicKey,
        registry: registryPda,
        adapterEntry: entryPda,
        adapterProgram: adapterToPause,
      } as any)
      .rpc();
    // Now pause it
    await program.methods
      .pauseAdapter(true)
      .accounts({
        admin: provider.wallet.publicKey,
        registry: registryPda,
        adapterEntry: entryPda,
      } as any)
      .rpc();
    const entry = await (program.account as any).adapterEntry.fetch(entryPda);
    expect(entry.isActive).to.equal(false);
    // Unpause
    await program.methods
      .pauseAdapter(false)
      .accounts({
        admin: provider.wallet.publicKey,
        registry: registryPda,
        adapterEntry: entryPda,
      } as any)
      .rpc();
    const entry2 = await (program.account as any).adapterEntry.fetch(entryPda);
    expect(entry2.isActive).to.equal(true);
  });
});
