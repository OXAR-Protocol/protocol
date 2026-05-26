import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

// ============================================================================
// Vault PDAs (personal and group are different seeds)
// ============================================================================

/// Personal vault: ["vault", creator, vault_id_le_bytes]
export function derivePersonalVaultPda(
  creator: PublicKey,
  vaultId: bigint
): [PublicKey, number] {
  const vaultIdBytes = bigintToLeBytes(vaultId, 8);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), creator.toBuffer(), vaultIdBytes],
    PROGRAM_ID
  );
}

/// Group vault: ["group", creator, vault_id_le_bytes]
export function deriveGroupVaultPda(
  creator: PublicKey,
  vaultId: bigint
): [PublicKey, number] {
  const vaultIdBytes = bigintToLeBytes(vaultId, 8);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("group"), creator.toBuffer(), vaultIdBytes],
    PROGRAM_ID
  );
}

/// Group member: ["member", group_vault, member_pubkey]
export function deriveGroupMemberPda(
  groupVault: PublicKey,
  member: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("member"), groupVault.toBuffer(), member.toBuffer()],
    PROGRAM_ID
  );
}

/// Rule: ["rule", owner, rule_id_le_bytes]
export function deriveRulePda(
  owner: PublicKey,
  ruleId: bigint
): [PublicKey, number] {
  const ruleIdBytes = bigintToLeBytes(ruleId, 8);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rule"), owner.toBuffer(), ruleIdBytes],
    PROGRAM_ID
  );
}

// ============================================================================
// Vault sub-account PDAs (shared between personal and group)
// ============================================================================

/// Share token mint: ["mint", vault]
export function deriveMintPda(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), vault.toBuffer()],
    PROGRAM_ID
  );
}

/// Hot USDC pool: ["pool", vault]
export function derivePoolPda(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), vault.toBuffer()],
    PROGRAM_ID
  );
}

// ============================================================================
// Helpers
// ============================================================================

function bigintToLeBytes(value: bigint, byteLength: number): Buffer {
  const buf = Buffer.alloc(byteLength);
  let v = value;
  for (let i = 0; i < byteLength; i++) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return buf;
}
