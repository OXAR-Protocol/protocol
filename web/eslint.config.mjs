import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Pre-existing, non-bug findings demoted to warnings so CI can gate on real
    // errors (and build + tests remain the hard safety net). Burn these down over
    // time; new genuine errors (e.g. rules-of-hooks) still fail the build.
    rules: {
      // Cosmetic — apostrophes/quotes in copy.
      "react/no-unescaped-entities": "warn",
      // React-Compiler readiness hints (new in Next 16's config); flag many valid
      // existing patterns (setState-on-mount effects, ref reads in animation code).
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      // Loosely-typed third-party shapes (Privy/wallet/SDK) — keep visible; annotate
      // with // SAFETY where intentional.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / vendored — not our source. `sdk-local/dist` is a committed copy
    // of the built @oxar/sdk (see web/CLAUDE.md); linting it produced thousands of
    // spurious warnings that drowned out real issues.
    "sdk-local/**",
    "coverage/**",
    ".vercel/**",
  ]),
]);

export default eslintConfig;
