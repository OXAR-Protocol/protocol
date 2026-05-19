export interface AiPrompt {
  id: string;
  title: string;
  blurb: string;
  agents: readonly string[];
  prompt: string;
}

const RADAR_CONTEXT = `You are integrating the OXAR Radar API.

Context:
- Base URL: https://radar.oxar.app/api/v1
- Auth: Bearer token in the Authorization header, e.g.
    Authorization: Bearer rdr_live_<key>
  Keys are minted at https://radar.oxar.app/dashboard (free during preview).
- Rate limits: 60 requests/minute, 10,000/month per key.
- Endpoints:
    GET  /protocols                  list of tracked RWA issuers
    GET  /protocols/:slug            single issuer + latest snapshot
                                     (nav, tvlUsd, apyBps, holderCount)
    POST /analyze/wallet             body { address, chains?, language? }
                                     returns positions, riskScore, weighted APY
- Response envelope: always JSON. Error bodies look like { "error": "code" }.
- Treat the API key as a secret. Read it from an env var, never hard-code.`;

export const AI_PROMPTS: readonly AiPrompt[] = [
  {
    id: "agent-handoff",
    title: "Agent handoff context",
    blurb: "The full Radar context block — paste once at the top of an agent thread.",
    agents: ["Claude", "Cursor", "Codex", "Aider"],
    prompt: RADAR_CONTEXT,
  },
  {
    id: "next-risk-page",
    title: "Add a /risk page to a Next.js app",
    blurb: "Builds a server component that loads the signed-in user's wallet and renders their RWA exposure.",
    agents: ["Claude", "Cursor"],
    prompt: `${RADAR_CONTEXT}

Task:
Add a new route at app/risk/page.tsx in this Next.js project that:
1. Reads the user's wallet address from their session (assume \`getWalletAddress()\` already exists in lib/auth.ts).
2. POSTs to /analyze/wallet with the address and chains ["ethereum", "solana"].
3. Renders the response with a table of positions, a total-USD heading, and the four risk-axis ratings.
4. Server component (no "use client"), uses RADAR_API_KEY from process.env.
5. Handles 401/429/500 with a friendly empty state.

Acceptance:
- Page lives at /risk and SSRs the first paint.
- Total USD value, weighted APY, and per-position rows render.
- Risk axes shown as four labelled chips.
- No secrets shipped to the browser.`,
  },
  {
    id: "telegram-bot",
    title: "Telegram bot that alerts on NAV drift",
    blurb: "A Node script that polls Radar every 5 min and pings a Telegram chat when a protocol's NAV moves >0.3%.",
    agents: ["Claude", "Cursor", "Codex"],
    prompt: `${RADAR_CONTEXT}

Task:
Write a Node.js script (worker.ts) that:
1. Every 5 minutes, fetches GET /protocols.
2. For each protocol slug, fetches GET /protocols/:slug and reads snapshot.nav.
3. Compares against the previous snapshot kept in memory.
4. If |delta| > 0.3% relative, sends a Telegram message to TELEGRAM_CHAT_ID via the Bot API.
5. Reads RADAR_API_KEY and TELEGRAM_BOT_TOKEN from env.
6. Logs structured JSON to stdout.

Acceptance:
- Runs forever with setInterval, exits cleanly on SIGTERM.
- First poll only records baseline (no spurious alert).
- Handles 429 with exponential backoff up to 5 min cap.
- Single file, no external state.`,
  },
  {
    id: "treasury-widget",
    title: "React widget for DAO treasury dashboards",
    blurb: "A drop-in <RadarWidget addresses={[...]}/> component for an existing dashboard.",
    agents: ["Claude", "Cursor"],
    prompt: `${RADAR_CONTEXT}

Task:
Create components/RadarWidget.tsx — a React component that:
1. Accepts \`addresses: string[]\` and \`apiKey: string\` props.
2. POSTs each address to /analyze/wallet in parallel.
3. Aggregates positions, total USD, and worst-case risk axes across the whole treasury.
4. Renders three tiles (Total RWA, Weighted APY, Concentration risk) plus a wallet-by-wallet table.
5. Uses fetch + useEffect; no external state library.
6. Memoises responses for 5 minutes to respect the 60 req/min limit.

Acceptance:
- Component is a single file, no external deps beyond React.
- Loading + error + empty states all visually distinct.
- Errors per wallet don't crash the whole widget.
- Currency formatted via Intl.NumberFormat.`,
  },
  {
    id: "etl-postgres",
    title: "Nightly ETL into your own Postgres",
    blurb: "A scheduled job that snapshots every protocol into your warehouse for historical analysis.",
    agents: ["Claude", "Cursor", "Codex"],
    prompt: `${RADAR_CONTEXT}

Task:
Write etl.ts that runs nightly (assume the scheduler exists) and:
1. Hits GET /protocols, then GET /protocols/:slug for each slug.
2. Inserts one row per protocol into a Postgres table 'radar_snapshots' with columns:
   slug, captured_at, nav, tvl_usd, apy_bps, holder_count, raw_jsonb.
3. Uses 'postgres' npm package, reads DATABASE_URL and RADAR_API_KEY from env.
4. Idempotent on (slug, captured_at) via INSERT … ON CONFLICT DO NOTHING.
5. Logs how many rows landed and exits 0 / 1.

Acceptance:
- One single transaction per run.
- Rate-limit aware: pauses ~1 s between protocol fetches.
- Doesn't crash on missing snapshot (writes null fields).
- SQL migration for the table is included as a comment at the top.`,
  },
];
