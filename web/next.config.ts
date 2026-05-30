import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // klend-sdk is a heavy, Node-only, WASM-bearing tree (orca/kliquidity/scope/farms).
  // Don't bundle it — require it at runtime from node_modules (the only importer is the
  // server-side /api/kamino route). Bundling breaks the orca WASM path resolution.
  serverExternalPackages: [
    "@kamino-finance/klend-sdk",
    "@kamino-finance/kliquidity-sdk",
    "@kamino-finance/scope-sdk",
    "@kamino-finance/farms-sdk",
    "@orca-so/whirlpools-core",
    "@orca-so/whirlpools",
  ],
};

export default nextConfig;
