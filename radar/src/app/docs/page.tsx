import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OXAR Radar — API documentation",
  description:
    "Reference for the OXAR Radar API. Real-time risk and wallet intelligence across Ethereum and Solana RWA protocols.",
};

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
        OXAR Radar · API v1
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Documentation</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        REST API over the same data the public analyzer uses. JSON in, JSON out,
        bearer-token auth. Pricing page lives at <Link href="/pricing" className="underline">/pricing</Link>.
      </p>

      <Section title="Base URL">
        <Code>https://radar.oxar.app/api/v1</Code>
      </Section>

      <Section title="Authentication">
        <p>Every <Code inline>/api/v1/*</Code> request needs an API key in the Authorization header:</p>
        <Code>
          {`Authorization: Bearer rdr_live_<your_key>`}
        </Code>
        <p className="mt-3">
          Keys are issued during onboarding. The raw key is shown once at creation and never again — store it
          immediately. Lost keys are rotated, not recovered.
        </p>
      </Section>

      <Section title="Rate limits">
        <Table
          rows={[
            ["Free", "60 req / min", "10,000 / month"],
            ["Starter", "600 req / min", "100,000 / month"],
            ["Pro", "6,000 req / min", "1,000,000 / month"],
            ["Enterprise", "Custom", "Custom"],
          ]}
          headers={["Tier", "Per-minute", "Per-month"]}
        />
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Every response carries{" "}
          <Code inline>X-RateLimit-Limit</Code>,{" "}
          <Code inline>X-RateLimit-Remaining</Code>, and{" "}
          <Code inline>X-RateLimit-Reset</Code> (Unix seconds).
          429 responses include <Code inline>Retry-After</Code>.
        </p>
      </Section>

      <Section title="GET /protocols">
        <p>List of supported RWA protocols and their static metadata.</p>
        <Code>{`curl https://radar.oxar.app/api/v1/protocols \\
  -H "Authorization: Bearer rdr_live_..."`}</Code>
        <Code>{`{
  "data": [
    {
      "slug": "ondo-usdy",
      "name": "Ondo USDY",
      "chain": "ethereum",
      "category": "us-treasuries",
      "contractAddress": "0x96F6e...",
      "issuer": { "name": "Ondo Finance", "jurisdiction": "BVI" },
      "estimatedApyBps": 480
    }
  ]
}`}</Code>
      </Section>

      <Section title="GET /protocols/:slug">
        <p>Single protocol with its latest snapshot inline (NAV, TVL, APY).</p>
        <Code>{`curl https://radar.oxar.app/api/v1/protocols/ondo-usdy \\
  -H "Authorization: Bearer rdr_live_..."`}</Code>
        <Code>{`{
  "slug": "ondo-usdy",
  "name": "Ondo USDY",
  "estimatedApyBps": 480,
  "snapshot": {
    "capturedAt": "2026-05-17T01:25:04.264Z",
    "nav": 1.10,
    "tvlUsd": 720245696,
    "apyBps": 480
  }
}`}</Code>
      </Section>

      <Section title="OpenAPI spec">
        <p>
          The full machine-readable spec lives at{" "}
          <Code inline>/api/openapi</Code>. Drop it into Postman, Insomnia,
          openapi-generator, or your client SDK builder of choice.
        </p>
      </Section>

      <Section title="Error codes">
        <Table
          headers={["Status", "Body code", "Meaning"]}
          rows={[
            ["400", "invalid_json / invalid_address", "Request body is malformed"],
            ["401", "missing_api_key / invalid_api_key", "Auth header missing or unknown key"],
            ["404", "not_found", "Unknown protocol slug"],
            ["429", "rate_limited", "Per-minute tier limit hit; see Retry-After"],
            ["500", "internal_error", "Unhandled server error; please retry"],
          ]}
        />
      </Section>

      <p className="mt-12 font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
        Not investment advice · Educational analytics
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-[var(--color-text-muted)]">{children}</div>
    </section>
  );
}

function Code({ children, inline = false }: { children: React.ReactNode; inline?: boolean }) {
  if (inline) {
    return (
      <code className="rounded bg-[var(--color-surface-1)] px-1.5 py-0.5 font-mono text-[12px] text-white">
        {children}
      </code>
    );
  }
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-[var(--color-surface-1)] p-4 font-mono text-[12px] leading-relaxed text-white">
      {children}
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="mt-2 w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-white/10">
          {headers.map((h) => (
            <th key={h} className="py-2 pr-4 text-left font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-white/5">
            {row.map((cell, j) => (
              <td key={j} className="py-2 pr-4 align-top text-white">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
