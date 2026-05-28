import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
    // Use SystemProgram (always executable) as the adapter program under test
    const dummyAdapter = SystemProgram.programId;
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
    // Use TOKEN_PROGRAM_ID (executable, distinct from the adapter in test 2)
    // so the auth constraint fires before any account-already-in-use error
    const dummyAdapter = TOKEN_PROGRAM_ID;
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

  // ============================================================
  // Edge cases: InvalidAdapterName, UnsupportedInterfaceVersion,
  // InvalidAdapterProgram (FIX I7)
  // ============================================================

  it("whitelist_adapter with empty name fails with InvalidAdapterName", async () => {
    const dummyAdapter = TOKEN_PROGRAM_ID; // executable, distinct from earlier tests
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId,
    );
    const [entryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("adapter_entry"), dummyAdapter.toBuffer()],
      program.programId,
    );
    try {
      await program.methods
        .whitelistAdapter("", 1)
        .accounts({
          admin: provider.wallet.publicKey,
          registry: registryPda,
          adapterEntry: entryPda,
          adapterProgram: dummyAdapter,
        } as any)
        .rpc();
      throw new Error("Expected InvalidAdapterName to fail");
    } catch (err: any) {
      expect(err.toString()).to.match(/InvalidAdapterName/);
    }
  });

  it("whitelist_adapter with name > 32 bytes fails with InvalidAdapterName", async () => {
    const dummyAdapter = TOKEN_PROGRAM_ID;
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId,
    );
    const [entryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("adapter_entry"), dummyAdapter.toBuffer()],
      program.programId,
    );
    const longName = "A".repeat(33); // 33 bytes — exceeds 32-byte limit
    try {
      await program.methods
        .whitelistAdapter(longName, 1)
        .accounts({
          admin: provider.wallet.publicKey,
          registry: registryPda,
          adapterEntry: entryPda,
          adapterProgram: dummyAdapter,
        } as any)
        .rpc();
      throw new Error("Expected InvalidAdapterName to fail");
    } catch (err: any) {
      expect(err.toString()).to.match(/InvalidAdapterName/);
    }
  });

  it("whitelist_adapter with interface_version != 1 fails with UnsupportedInterfaceVersion", async () => {
    const dummyAdapter = TOKEN_PROGRAM_ID;
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId,
    );
    const [entryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("adapter_entry"), dummyAdapter.toBuffer()],
      program.programId,
    );
    try {
      await program.methods
        .whitelistAdapter("ValidName", 99) // unsupported version
        .accounts({
          admin: provider.wallet.publicKey,
          registry: registryPda,
          adapterEntry: entryPda,
          adapterProgram: dummyAdapter,
        } as any)
        .rpc();
      throw new Error("Expected UnsupportedInterfaceVersion to fail");
    } catch (err: any) {
      expect(err.toString()).to.match(/UnsupportedInterfaceVersion/);
    }
  });

  it("whitelist_adapter with non-executable program fails with InvalidAdapterProgram", async () => {
    // A freshly generated keypair pubkey is NOT an executable program account
    const nonExecutable = Keypair.generate().publicKey;
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId,
    );
    const [entryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("adapter_entry"), nonExecutable.toBuffer()],
      program.programId,
    );
    try {
      await program.methods
        .whitelistAdapter("NonExec", 1)
        .accounts({
          admin: provider.wallet.publicKey,
          registry: registryPda,
          adapterEntry: entryPda,
          adapterProgram: nonExecutable,
        } as any)
        .rpc();
      throw new Error("Expected InvalidAdapterProgram to fail");
    } catch (err: any) {
      expect(err.toString()).to.match(/InvalidAdapterProgram/);
    }
  });

  it("admin can pause adapter", async () => {
    // Use the program itself as the adapter — it is executable and a known distinct key
    const adapterToPause = program.programId;
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
    // Pause it: active = false → paused
    await program.methods
      .pauseAdapter(false)
      .accounts({
        admin: provider.wallet.publicKey,
        registry: registryPda,
        adapterEntry: entryPda,
      } as any)
      .rpc();
    const entry = await (program.account as any).adapterEntry.fetch(entryPda);
    expect(entry.isActive).to.equal(false);
    // Unpause: active = true → active
    await program.methods
      .pauseAdapter(true)
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
