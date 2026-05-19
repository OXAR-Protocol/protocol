import Link from "next/link";
import type { Metadata } from "next";

import { Callout, CodeSurface, DocPage, DocSection } from "../_components/prose";

export const metadata: Metadata = {
  title: "Quickstart examples — OXAR Radar",
};

const TOC = [
  { id: "setup", label: "Setup" },
  { id: "curl", label: "cURL" },
  { id: "node", label: "Node / TypeScript" },
  { id: "python", label: "Python" },
];

export default function ExamplesPage() {
  return (
    <DocPage
      eyebrow="Examples"
      title="End-to-end quickstart"
      description="From minting a free key to reading a wallet's RWA exposure in three languages."
      toc={TOC}
    >
      <DocSection id="setup" title="Setup">
        <p>
          1. Mint a key at <Link href="/dashboard">/dashboard</Link>.
          <br />
          2. Export it in your shell:
        </p>
        <CodeSurface title="bash">
          {`export RADAR_KEY="rdr_live_..."`}
        </CodeSurface>
        <Callout>
          Examples below use <code>RADAR_KEY</code> as the variable name everywhere
          for consistency. Substitute your own naming if you prefer.
        </Callout>
      </DocSection>

      <DocSection id="curl" title="cURL">
        <CodeSurface title="List protocols">
          {`curl https://radar.oxar.app/api/v1/protocols \\
  -H "Authorization: Bearer $RADAR_KEY" | jq`}
        </CodeSurface>
        <CodeSurface title="Single protocol snapshot">
          {`curl https://radar.oxar.app/api/v1/protocols/blackrock-buidl \\
  -H "Authorization: Bearer $RADAR_KEY" | jq`}
        </CodeSurface>
        <CodeSurface title="Analyze a wallet">
          {`curl -X POST https://radar.oxar.app/api/v1/analyze/wallet \\
  -H "Authorization: Bearer $RADAR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","chains":["ethereum"]}' | jq`}
        </CodeSurface>
      </DocSection>

      <DocSection id="node" title="Node / TypeScript">
        <CodeSurface title="lib/radar.ts">
          {`const BASE = "https://radar.oxar.app/api/v1";
const KEY = process.env.RADAR_KEY!;

async function radar<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(\`\${BASE}\${path}\`, {
    ...init,
    headers: {
      Authorization: \`Bearer \${KEY}\`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(\`Radar \${path} → \${r.status}\`);
  return r.json() as Promise<T>;
}

export const protocols = () => radar<{ data: unknown[] }>("/protocols");
export const protocol = (slug: string) => radar(\`/protocols/\${slug}\`);
export const analyzeWallet = (address: string, chains = ["ethereum"]) =>
  radar("/analyze/wallet", {
    method: "POST",
    body: JSON.stringify({ address, chains }),
  });`}
        </CodeSurface>
      </DocSection>

      <DocSection id="python" title="Python">
        <CodeSurface title="radar.py">
          {`import os
import requests

BASE = "https://radar.oxar.app/api/v1"
HEADERS = {"Authorization": f"Bearer {os.environ['RADAR_KEY']}"}


def protocols():
    r = requests.get(f"{BASE}/protocols", headers=HEADERS)
    r.raise_for_status()
    return r.json()["data"]


def protocol(slug: str):
    r = requests.get(f"{BASE}/protocols/{slug}", headers=HEADERS)
    r.raise_for_status()
    return r.json()


def analyze_wallet(address: str, chains=None):
    r = requests.post(
        f"{BASE}/analyze/wallet",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"address": address, "chains": chains or ["ethereum"]},
    )
    r.raise_for_status()
    return r.json()`}
        </CodeSurface>
      </DocSection>
    </DocPage>
  );
}
