export interface ServerEnv {
  alchemyApiKey: string;
  heliusApiKey: string | undefined;
  anthropicApiKey: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  cronSecret: string | undefined;
  adminSecret: string | undefined;
  privyAppSecret: string | undefined;
  appBaseUrl: string;
  rateLimitRequestsPerWindow: number;
  rateLimitWindowMs: number;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const alchemyApiKey = process.env.ALCHEMY_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!alchemyApiKey) throw new Error("ALCHEMY_API_KEY is not set");
  if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!supabaseServiceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  cached = {
    alchemyApiKey,
    heliusApiKey: process.env.HELIUS_API_KEY || undefined,
    anthropicApiKey,
    supabaseUrl,
    supabaseServiceRoleKey,
    cronSecret: process.env.CRON_SECRET || undefined,
    adminSecret: process.env.ADMIN_SECRET || undefined,
    privyAppSecret: process.env.PRIVY_APP_SECRET || undefined,
    appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
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
