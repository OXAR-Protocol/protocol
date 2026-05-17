export interface ServerEnv {
  alchemyApiKey: string;
  anthropicApiKey: string;
  rateLimitRequestsPerWindow: number;
  rateLimitWindowMs: number;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const alchemyApiKey = process.env.ALCHEMY_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!alchemyApiKey) throw new Error("ALCHEMY_API_KEY is not set");
  if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  cached = {
    alchemyApiKey,
    anthropicApiKey,
    rateLimitRequestsPerWindow: parseIntOr(process.env.RATE_LIMIT_REQUESTS_PER_WINDOW, 5),
    rateLimitWindowMs: parseIntOr(process.env.RATE_LIMIT_WINDOW_MS, 600_000),
  };

  return cached;
}

function parseIntOr(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
