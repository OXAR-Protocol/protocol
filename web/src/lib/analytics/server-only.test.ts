import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

import { KORA_FEE_PAYERS } from "@oxar/sdk";

/**
 * A server module must not import a `"use client"` one.
 *
 * Next replaces a client module's exports with client-reference proxies inside the
 * server bundle. A function import fails loudly; a plain VALUE does not — reading it
 * throws at the point of use, deep inside a loop, wearing whatever message the
 * surrounding catch gives it.
 *
 * That shipped: the volume sync imported the relayer address set from the Kora client
 * helper, and every wallet came back "incomplete", which reads as a rate limit. The
 * job reported $0 of volume and nothing said why. Neither the type-checker nor the
 * build objects, so the check has to live here.
 */
const SRC = resolve(__dirname, "../..");

function importedFiles(entry: string): string[] {
  const source = readFileSync(entry, "utf8");
  const out: string[] = [];
  for (const m of source.matchAll(/from\s+"([^"]+)"/g)) {
    const spec = m[1];
    const base = spec.startsWith("@/")
      ? resolve(SRC, spec.slice(2))
      : spec.startsWith(".")
        ? resolve(dirname(entry), spec)
        : null;
    if (!base) continue; // a package, not our source
    for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
      if (existsSync(candidate)) {
        out.push(candidate);
        break;
      }
    }
  }
  return out;
}

/** Everything a module pulls in, transitively. */
function importClosure(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...importedFiles(file));
  }
  seen.delete(entry);
  return seen;
}

const isClientModule = (file: string) =>
  /^\s*["']use client["']/.test(readFileSync(file, "utf8"));

describe("volume-sync stays on the server", () => {
  const entry = resolve(SRC, "lib/analytics/volume-sync.ts");

  it("pulls in nothing marked \"use client\"", () => {
    const offenders = [...importClosure(entry)].filter(isClientModule);
    expect(offenders.map((f) => f.replace(`${SRC}/`, ""))).toEqual([]);
  });

  it("reads the relayer set from the SDK, where the server can touch it", () => {
    expect(KORA_FEE_PAYERS).toBeInstanceOf(Set);
    expect(KORA_FEE_PAYERS.has("MQwRCwbeRmhpNdAjvkMysLHS92WSXQvw7wJ8hPoYFrL")).toBe(true);
  });
});
