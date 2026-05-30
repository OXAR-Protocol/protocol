import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Resolve the `@/…` path alias (mirrors tsconfig paths) so tests can import app modules.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
