import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export function deriveVaultPda(
  region: string,
  denomination: string,
  assetSubtype: string,
  series: number = 1
): [PublicKey, number] {
  const seriesBytes = Buffer.alloc(2);
  seriesBytes.writeUInt16LE(series);
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault"),
      Buffer.from(region),
      Buffer.from(denomination),
      Buffer.from(assetSubtype),
      seriesBytes,
    ],
    PROGRAM_ID
  );
}

export function deriveMintPda(vaultPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), vaultPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function derivePoolPda(vaultPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), vaultPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveListingPda(
  vaultPubkey: PublicKey,
  sellerPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("listing"),
      vaultPubkey.toBuffer(),
      sellerPubkey.toBuffer(),
    ],
    PROGRAM_ID
  );
}

export function deriveEscrowPda(
  vaultPubkey: PublicKey,
  sellerPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      vaultPubkey.toBuffer(),
      sellerPubkey.toBuffer(),
    ],
    PROGRAM_ID
  );
}
