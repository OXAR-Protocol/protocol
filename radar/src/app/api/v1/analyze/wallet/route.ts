import { NextResponse } from "next/server";

import type { Chain, ExplainOutput } from "@oxar/radar-core";

import { runAnalyze } from "@/lib/analyze";
import { withApiKey } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_CHAINS: readonly Chain[] = ["ethereum", "solana"];
const ALLOWED_LANGUAGES: readonly ExplainOutput["language"][] = ["en", "ru", "pl"];

interface AnalyzeBody {
  address?: unknown;
  chains?: unknown;
  language?: unknown;
}

interface ValidatedInput {
  walletAddress: string;
  chains: Chain[];
  language: ExplainOutput["language"];
}

function isAddressLike(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function validate(body: AnalyzeBody): ValidatedInput | { error: string } {
  if (typeof body.address !== "string" || !isAddressLike(body.address)) {
    return { error: "invalid_address" };
  }

  const chains = Array.isArray(body.chains)
    ? body.chains.filter((c): c is Chain => ALLOWED_CHAINS.includes(c as Chain))
    : ["ethereum" as Chain];

  if (chains.length === 0) return { error: "no_chains" };

  const language =
    typeof body.language === "string" &&
    ALLOWED_LANGUAGES.includes(body.language as ExplainOutput["language"])
      ? (body.language as ExplainOutput["language"])
      : "en";

  return { walletAddress: body.address, chains, language };
}

export const POST = withApiKey(async (request) => {
  let body: AnalyzeBody;
  try {
    body = (await request.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const validated = validate(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const result = await runAnalyze(validated);
    return NextResponse.json(result);
  } catch (err) {
    console.error("analyze/wallet failed", err);
    return NextResponse.json({ error: "analyze_failed" }, { status: 500 });
  }
});
