"use client";

import Link from "next/link";
import { useState } from "react";

type Lang = "curl" | "javascript" | "python";

const SAMPLES: Record<Lang, string> = {
  curl: `curl https://radar.oxar.app/api/v1/protocols/ondo-usdy \\
  -H "Authorization: Bearer rdr_live_..."`,
  javascript: `const res = await fetch(
  "https://radar.oxar.app/api/v1/protocols/ondo-usdy",
  { headers: { Authorization: "Bearer rdr_live_..." } }
);
const protocol = await res.json();`,
  python: `import requests

r = requests.get(
    "https://radar.oxar.app/api/v1/protocols/ondo-usdy",
    headers={"Authorization": "Bearer rdr_live_..."},
)
protocol = r.json()`,
};

const RESPONSE = `{
  "slug": "ondo-usdy",
  "name": "Ondo USDY",
  "chain": "ethereum",
  "category": "us-treasuries",
  "contractAddress": "0x96F6eF951840721AdBF46Ac996b59E0235CB985C",
  "estimatedApyBps": 480,
  "snapshot": {
    "capturedAt": "2026-05-19T07:30:04.264Z",
    "nav": 1.10,
    "tvlUsd": 720245696,
    "apyBps": 480
  }
}`;

const LABELS: Record<Lang, string> = {
  curl: "cURL",
  javascript: "JavaScript",
  python: "Python",
};

export function CodeSnippet() {
  const [lang, setLang] = useState<Lang>("curl");

  return (
    <section className="px-6 py-20 lg:px-12 lg:py-28">
      <div className="flex items-baseline gap-4 border-t border-[var(--color-line)] pt-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-dim)]">
          06 /
        </span>
        <span className="eyebrow">Developer experience</span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] tracking-tight">
            JSON in. <span className="text-[var(--color-text-muted)]">JSON out.</span>
          </h2>
          <p className="mt-5 max-w-md text-[var(--color-text-muted)]">
            One bearer token, predictable schemas, OpenAPI spec for code generation. No
            GraphQL gotchas, no SDK lock-in.
          </p>
          <Link
            href="/docs"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-white"
          >
            Read the full docs →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <CodeBlock title="Request">
            <div className="mb-3 flex gap-1">
              {(Object.keys(SAMPLES) as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition ${
                    lang === l
                      ? "bg-[var(--color-accent)] text-black"
                      : "text-[var(--color-text-muted)] hover:text-white"
                  }`}
                >
                  {LABELS[l]}
                </button>
              ))}
            </div>
            <pre className="overflow-x-auto whitespace-pre text-[12px] leading-relaxed text-white">
              {SAMPLES[lang]}
            </pre>
          </CodeBlock>

          <CodeBlock title="Response">
            <pre className="overflow-x-auto whitespace-pre text-[12px] leading-relaxed text-white">
              <SyntaxHighlight json={RESPONSE} />
            </pre>
          </CodeBlock>
        </div>
      </div>
    </section>
  );
}

function CodeBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-1)]">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
          {title}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
      </div>
      <div className="p-4 font-mono">{children}</div>
    </div>
  );
}

function SyntaxHighlight({ json }: { json: string }) {
  // Cheap colorizer: tag JSON strings, numbers, keys.
  const parts = json.split(/(\".*?\"\s*:|\".*?\"|\d+\.?\d*|null|true|false)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\".*\"\s*:$/.test(part))
          return <span key={i} className="text-[var(--color-cyan)]">{part}</span>;
        if (/^\".*\"$/.test(part))
          return <span key={i} className="text-[var(--color-accent)]">{part}</span>;
        if (/^\d/.test(part))
          return <span key={i} className="text-[var(--color-warn)]">{part}</span>;
        if (/^(null|true|false)$/.test(part))
          return <span key={i} className="text-[var(--color-text-muted)]">{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
