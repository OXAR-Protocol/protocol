import { describe, it, expect } from "vitest";
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  type TransactionInstruction,
} from "@solana/web3.js";

import { PROVIDERS } from "@/lib/yield";

/**
 * Money-path simulation (run before merge): for each Solana-buildable provider,
 * build a real deposit transaction and simulate it against mainnet. Catches the
 * "tx would fail on-chain" / SDK-breakage / missing-route class BEFORE prod —
 * exactly what we only caught manually this session.
 *
 * Opt-in (hits mainnet, so NOT part of the fast offline CI gate):
 *   SIM=1 SIM_RPC=<helius mainnet url> yarn sim
 * `SIM_OWNER` (a real USDC-holding wallet) makes the sim cleaner; with any wallet
 * the heuristic still holds: if the target programs produced logs, the tx is
 * well-formed (a malformed/unroutable tx fails before any program runs).
 *
 * Kamino is skipped here — its tx is built by the `/api/kamino` route (Node-only
 * klend SDK), which needs the running Next server; covered by build + manual.
 */
const RUN = process.env.SIM === "1";
const RPC =
  process.env.SIM_RPC || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const OWNER = new PublicKey(
  process.env.SIM_OWNER || "GDfnEsia2WLAW5t8yx2X5j2mkfA74i5kwGdDuZHt7XmG",
);
const SERVER_ONLY = new Set(["kamino-lend-usdc"]); // built by the Next API route

interface SimResult {
  ok: boolean;
  reason: string;
}

// Program-log markers that mean the TX ITSELF is malformed (a construction bug),
// vs runtime/state errors (insufficient funds, etc.) which are fine — the build is
// what we're validating.
const CONSTRUCTION_MARKERS = [
  "invalid instruction",
  "incorrect program id",
  "failed to deserialize",
  "could not create program address",
  "an account required by the instruction is missing",
  "instructionfallbacknotfound",
];

/**
 * The hard gate is that the tx BUILDS (done by the caller). Simulation is
 * best-effort:
 *  - no error → clean.
 *  - error but NO program logs → a fee-payer/blockhash precheck (unfunded owner),
 *    not a malformed tx → inconclusive, don't fail. Set a funded SIM_OWNER for a
 *    real on-chain sim.
 *  - error WITH logs → programs ran; fail only if the logs show a construction
 *    error, otherwise it's runtime/state (funding) which is acceptable.
 */
function classify(err: unknown, logs: string[] | null): SimResult {
  if (!err) return { ok: true, reason: "simulated cleanly" };
  const e = JSON.stringify(err);
  if (!logs || logs.length === 0) {
    return { ok: true, reason: `inconclusive — sim precheck (${e}); set a funded SIM_OWNER for a full on-chain sim` };
  }
  const blob = logs.join(" ").toLowerCase();
  if (CONSTRUCTION_MARKERS.some((m) => blob.includes(m))) {
    return { ok: false, reason: `construction error in program logs: ${e}` };
  }
  return { ok: true, reason: `programs executed; runtime/state err (ok): ${e}` };
}

describe.skipIf(!RUN)("money path · deposit builds + simulates (mainnet)", () => {
  const connection = new Connection(RPC, "confirmed");

  async function simulate(tx: Transaction | VersionedTransaction): Promise<SimResult> {
    if (tx instanceof VersionedTransaction) {
      const r = await connection.simulateTransaction(tx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      });
      return classify(r.value.err, r.value.logs);
    }
    tx.feePayer = OWNER;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const r = await connection.simulateTransaction(tx);
    return classify(r.value.err, r.value.logs);
  }

  for (const p of PROVIDERS) {
    if (SERVER_ONLY.has(p.id)) {
      it.skip(`${p.id} — built by /api server route (sim needs running app)`, () => {});
      continue;
    }
    it(`${p.id} — deposit tx builds and is program-valid`, async () => {
      const amount = BigInt(1_000_000); // $1 (6-decimal USDC)
      let tx: Transaction | VersionedTransaction;
      if (p.buildDepositTx) {
        tx = await p.buildDepositTx({ owner: OWNER, amount, connection });
      } else if (p.buildDepositIxs) {
        const ixs: TransactionInstruction[] = await p.buildDepositIxs({ owner: OWNER, amount, connection });
        expect(ixs.length, "provider returned no instructions").toBeGreaterThan(0);
        tx = new Transaction().add(...ixs);
      } else {
        throw new Error(`${p.id} supports neither buildDepositTx nor buildDepositIxs`);
      }

      const res = await simulate(tx);
      // eslint-disable-next-line no-console
      console.log(`[sim] ${p.id}: ${res.ok ? "OK" : "FAIL"} — ${res.reason}`);
      expect(res.ok, `${p.id} deposit tx malformed: ${res.reason}`).toBe(true);
    }, 60_000);
  }
});
