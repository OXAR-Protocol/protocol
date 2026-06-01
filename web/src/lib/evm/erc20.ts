import { encodeFunctionData, erc20Abi } from "viem";

import { EVM_NATIVE_SENTINEL } from "@/lib/portfolio/evm-assets";
import { publicClientFor, type Eip1193 } from "./chains";

/** True for the native coin (zero address) — no ERC-20 approval needed. */
export function isNativeEvm(tokenAddress: string): boolean {
  return tokenAddress.toLowerCase() === EVM_NATIVE_SENTINEL;
}

/** ABI-encoded `approve(spender, amount)` calldata. */
export function encodeApprove(spender: string, amount: bigint): string {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [spender as `0x${string}`, amount],
  });
}

/** Current ERC-20 allowance the owner has granted the spender (base units).
 * Reads via the connected wallet's RPC (`provider`) — the default public RPC is flaky. */
export async function readAllowance(params: {
  chainId: number;
  token: string;
  owner: string;
  spender: string;
  provider?: Eip1193;
}): Promise<bigint> {
  const client = publicClientFor(params.chainId, params.provider);
  return client.readContract({
    address: params.token as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [params.owner as `0x${string}`, params.spender as `0x${string}`],
  });
}
