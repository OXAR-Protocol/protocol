import { describe, it, expect } from "vitest";

import { isSameOrigin, isAllowedRpcBody } from "./rpc-proxy";

describe("isSameOrigin", () => {
  it("accepts the app's own pages", () => {
    expect(isSameOrigin("https://app.oxar.app", "https://app.oxar.app/api/rpc")).toBe(true);
  });

  it("rejects another site's page", () => {
    expect(isSameOrigin("https://evil.example", "https://app.oxar.app/api/rpc")).toBe(false);
  });

  it("allows a request with no Origin — same-origin fetch may omit it", () => {
    expect(isSameOrigin(null, "https://app.oxar.app/api/rpc")).toBe(true);
  });

  it("rejects a malformed Origin rather than guessing", () => {
    expect(isSameOrigin("not a url", "https://app.oxar.app/api/rpc")).toBe(false);
  });
});

describe("isAllowedRpcBody", () => {
  it("passes the calls the app makes", () => {
    expect(isAllowedRpcBody({ jsonrpc: "2.0", id: 1, method: "getLatestBlockhash" })).toBe(true);
    expect(isAllowedRpcBody({ jsonrpc: "2.0", id: 1, method: "sendTransaction" })).toBe(true);
  });

  it("refuses the quota burners", () => {
    // Walks an entire program; nothing here asks for it and a stranger would.
    expect(isAllowedRpcBody({ jsonrpc: "2.0", id: 1, method: "getProgramAccounts" })).toBe(false);
  });

  it("refuses batches and junk", () => {
    expect(isAllowedRpcBody([{ method: "getBalance" }])).toBe(false);
    expect(isAllowedRpcBody({ method: 42 })).toBe(false);
    expect(isAllowedRpcBody(null)).toBe(false);
  });
});
