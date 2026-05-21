import Anthropic from "@anthropic-ai/sdk";

import type { ExplainOutput, WalletAnalysis } from "../types";
import { buildSystemPrompt } from "./prompts";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1024;

export interface ExplainConfig {
  anthropicApiKey: string;
  model?: string;
  language?: ExplainOutput["language"];
}

export class ExplainParseError extends Error {
  constructor(
    public readonly rawText: string,
    cause?: unknown,
  ) {
    super("Claude returned content that did not parse as JSON");
    this.cause = cause;
  }
}

export async function explainWallet(
  analysis: WalletAnalysis,
  config: ExplainConfig,
): Promise<ExplainOutput> {
  const language = config.language ?? "en";
  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  const response = await client.messages.create({
    model: config.model ?? DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(language),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildUserMessage(analysis),
      },
    ],
  });

  const rawText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return parseExplainOutput(rawText, language);
}

function buildUserMessage(analysis: WalletAnalysis): string {
  const compact = {
    walletAddress: analysis.walletAddress,
    chains: analysis.chains,
    totalValueUsd: round(analysis.totalValueUsd, 2),
    weightedApyBps: analysis.weightedApyBps,
    riskScore: analysis.riskScore,
    concentrationByProtocol: roundValues(analysis.concentrationByProtocol),
    concentrationByChain: roundValues(analysis.concentrationByChain),
    positions: analysis.positions.map((p) => ({
      protocol: p.protocolName,
      slug: p.protocolSlug,
      chain: p.chain,
      valueUsd: round(p.valueUsd, 2),
      apyBps: p.yieldApyBps,
    })),
  };

  return `Analyze this RWA portfolio and return JSON only.\n\n${JSON.stringify(compact, null, 2)}`;
}

function parseExplainOutput(
  rawText: string,
  language: ExplainOutput["language"],
): ExplainOutput {
  const jsonText = extractJsonObject(rawText);

  try {
    const parsed = JSON.parse(jsonText) as Partial<ExplainOutput>;
    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.risks !== "string" ||
      typeof parsed.recommendations !== "string"
    ) {
      throw new Error("Missing required fields");
    }
    return {
      summary: parsed.summary,
      risks: parsed.risks,
      recommendations: parsed.recommendations,
      language,
    };
  } catch (err) {
    throw new ExplainParseError(rawText, err);
  }
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundValues<K extends string>(
  record: Record<K, number>,
): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const key in record) {
    out[key] = round(record[key], 4);
  }
  return out;
}
