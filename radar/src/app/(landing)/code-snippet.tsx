"use client";

import { useState } from "react";

import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/button";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";

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
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <AnimatedSection>
            <SectionLabel>Developer Experience</SectionLabel>
            <div className="mt-4">
              <SectionTitle>
                JSON in.
                <br />
                <span className="text-white/50">JSON out.</span>
              </SectionTitle>
            </div>
            <p className="mt-6 max-w-md font-mono text-base leading-relaxed text-white/50 [&>strong]:font-normal [&>strong]:text-white">
              One bearer token, predictable schemas, <strong>OpenAPI spec</strong> for
              code generation. No GraphQL gotchas, no SDK lock-in.
            </p>
            <div className="mt-8">
              <Button variant="ghost" href="/docs">
                Read the full docs →
              </Button>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <CodeBlock title="Request">
                <div className="mb-3 flex gap-1">
                  {(Object.keys(SAMPLES) as Lang[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition ${
                        lang === l
                          ? "bg-white text-surface-0"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {LABELS[l]}
                    </button>
                  ))}
                </div>
                <pre className="overflow-x-auto whitespace-pre font-mono text-[12px] leading-relaxed text-white">
                  {SAMPLES[lang]}
                </pre>
              </CodeBlock>

              <CodeBlock title="Response">
                <pre className="overflow-x-auto whitespace-pre font-mono text-[12px] leading-relaxed text-white">
                  <Highlight json={RESPONSE} />
                </pre>
              </CodeBlock>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function CodeBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[5px] border border-white/10 bg-surface-0">
      <div className="flex items-center justify-between border-b border-white/10 bg-surface-1 px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          {title}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Highlight({ json }: { json: string }) {
  const parts = json.split(/(\".*?\"\s*:|\".*?\"|\d+\.?\d*|null|true|false)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\".*\"\s*:$/.test(part)) return <span key={i} className="text-accent">{part}</span>;
        if (/^\".*\"$/.test(part)) return <span key={i} className="text-white/70">{part}</span>;
        if (/^\d/.test(part)) return <span key={i} className="text-white">{part}</span>;
        if (/^(null|true|false)$/.test(part)) return <span key={i} className="text-white/50">{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
