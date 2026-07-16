import { describe, it, expect } from "vitest";

import { encodeApprove, isNativeEvm } from "./erc20";
import { EVM_NATIVE_SENTINEL } from "@oxar/sdk";

describe("isNativeEvm", () => {
  it("treats the zero address as native (case-insensitive)", () => {
    expect(isNativeEvm(EVM_NATIVE_SENTINEL)).toBe(true);
    expect(isNativeEvm("0x0000000000000000000000000000000000000000")).toBe(true);
    expect(isNativeEvm("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913")).toBe(false);
  });
});

describe("encodeApprove", () => {
  it("encodes the ERC-20 approve selector + args", () => {
    const data = encodeApprove("0x12B797D9d7947c4cb97e87178182835e31530597", 1_000_000n);
    expect(data.startsWith("0x095ea7b3")).toBe(true); // approve(address,uint256) selector
    // amount 1_000_000 = 0xf4240 padded to 32 bytes
    expect(data.endsWith("00000000000000000000000000000000000000000000000000000000000f4240")).toBe(true);
  });
});
