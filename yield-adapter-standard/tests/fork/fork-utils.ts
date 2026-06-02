// Helpers for mainnet-fork tests on bankrun: clone real mainnet accounts into the
// local BanksServer, and fabricate a funded USDC token account (USDC's mint
// authority is Circle, so we can't mint — we inject a pre-built account instead).
import { Connection, PublicKey } from "@solana/web3.js";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { AddedAccount } from "solana-bankrun";

/// Public mainnet RPC by default; override with MAINNET_RPC_URL for faster, un-rate-
/// limited cloning. The repo ships no private key — judges can use the default.
export const MAINNET_RPC =
  process.env.MAINNET_RPC_URL ?? "https://api.mainnet-beta.solana.com";

/// Fetch the given mainnet accounts and shape them for `startAnchor`'s clone list.
export async function cloneFromMainnet(keys: PublicKey[]): Promise<AddedAccount[]> {
  const conn = new Connection(MAINNET_RPC, "confirmed");
  const infos = await conn.getMultipleAccountsInfo(keys);
  return keys.map((address, i) => {
    const info = infos[i];
    if (!info) throw new Error(`mainnet account not found (clone failed): ${address.toBase58()}`);
    return {
      address,
      info: {
        lamports: info.lamports,
        data: info.data,
        owner: info.owner,
        executable: info.executable,
        rentEpoch: 0,
      },
    };
  });
}

/// Bytes of an SPL token account holding `amount` of `mint`, owned by `owner`.
/// Inject via `context.setAccount` to fund a wallet on the fork.
export function usdcTokenAccount(mint: PublicKey, owner: PublicKey, amount: bigint) {
  const data = Buffer.alloc(AccountLayout.span);
  AccountLayout.encode(
    {
      mint,
      owner,
      amount,
      delegateOption: 0,
      delegate: PublicKey.default,
      state: 1, // initialized
      isNativeOption: 0,
      isNative: 0n,
      delegatedAmount: 0n,
      closeAuthorityOption: 0,
      closeAuthority: PublicKey.default,
    },
    data,
  );
  return {
    lamports: 2_039_280, // rent-exempt minimum for 165 bytes
    data,
    owner: TOKEN_PROGRAM_ID,
    executable: false,
    rentEpoch: 0,
  };
}
