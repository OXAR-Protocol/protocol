import { NextResponse } from "next/server";

import { runAnalyze } from "@/lib/analyze";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

import type { Chain, ExplainOutput } from "@oxar/radar-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_CHAINS: readonly Chain[] = ["ethereum", "solana"];
const ALLOWED_LANGUAGES: readonly ExplainOutput["language"][] = ["en", "ru", "pl"];

interface AnalyzeRequestBody {
  address?: unknown;
  chains?: unknown;
  language?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const env = getServerEnv();
  const ip = clientIpFrom(request);
  const limit = checkRateLimit(
    `analyze:${ip}`,
    env.rateLimitRequestsPerWindow,
    env.rateLimitWindowMs,
  );

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: limit.resetAt },
      {
        status: 429,
        headers: rateLimitHeaders(env.rateLimitRequestsPerWindow, limit.remaining, limit.resetAt),
      },
    );
  }

  let body: AnalyzeRequestBody;
  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const validation = validate(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const result = await runAnalyze(validation);
    return NextResponse.json(result, {
      headers: rateLimitHeaders(env.rateLimitRequestsPerWindow, limit.remaining, limit.resetAt),
    });
  } catch (err) {
    console.error("analyze failed", err);
    return NextResponse.json({ error: "analyze_failed" }, { status: 500 });
  }
}

function validate(body: AnalyzeRequestBody):
  | { walletAddress: string; chains: Chain[]; language: ExplainOutput["language"] }
  | { error: string } {
  if (typeof body.address !== "string" || !isAddressLike(body.address)) {
    return { error: "invalid_address" };
  }

  const chains = Array.isArray(body.chains)
    ? (body.chains.filter((c): c is Chain => ALLOWED_CHAINS.includes(c as Chain)))
    : ["ethereum" as Chain];

  if (chains.length === 0) return { error: "no_chains" };

  const language =
    typeof body.language === "string" &&
    ALLOWED_LANGUAGES.includes(body.language as ExplainOutput["language"])
      ? (body.language as ExplainOutput["language"])
      : "en";

  return { walletAddress: body.address, chains, language };
}

function isAddressLike(value: string): boolean {
  if (/^0x[a-fA-F0-9]{40}$/.test(value)) return true;
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return true;
  return false;
}

function rateLimitHeaders(limit: number, remaining: number, resetAt: number): HeadersInit {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}
