import type { Metadata } from "next";

import { LivePreview } from "../_components/live-preview";
import { CodeSurface, DocPage, DocSection, PropTable } from "../_components/prose";

export const metadata: Metadata = {
  title: "Protocols — OXAR Radar API",
};

const TOC = [
  { id: "list", label: "List protocols" },
  { id: "single", label: "Single protocol" },
  { id: "schema", label: "Schemas" },
];

export default function ProtocolsPage() {
  return (
    <DocPage
      eyebrow="API Reference"
      title="Protocols"
      description="Read every tracked RWA issuer and its latest 5-minute snapshot."
      toc={TOC}
    >
      <DocSection id="list" title="GET /protocols">
        <p>Returns every active protocol with its static metadata.</p>
        <CodeSurface title="Request">
          {`curl https://radar.oxar.app/api/v1/protocols \\
  -H "Authorization: Bearer rdr_live_..."`}
        </CodeSurface>
        <LivePreview method="GET" path="/protocols" title="GET /api/v1/protocols" />
        <CodeSurface title="200 OK">
          {`{
  "data": [
    {
      "slug": "blackrock-buidl",
      "name": "BlackRock BUIDL",
      "chain": "ethereum",
      "category": "us-treasuries",
      "contractAddress": "0x7712c34205737192402172409a8F7ccef8aA2AEc",
      "decimals": 6,
      "description": "BlackRock USD Institutional Digital Liquidity Fund",
      "issuer": { "name": "BlackRock", "jurisdiction": "USA" },
      "websiteUrl": "https://securitize.io",
      "estimatedApyBps": 460
    }
    // ...
  ]
}`}
        </CodeSurface>
      </DocSection>

      <DocSection id="single" title="GET /protocols/:slug">
        <p>
          Returns one protocol with its latest snapshot inline. <code>:slug</code>{" "}
          values come from the list endpoint.
        </p>
        <CodeSurface title="Request">
          {`curl https://radar.oxar.app/api/v1/protocols/ondo-usdy \\
  -H "Authorization: Bearer rdr_live_..."`}
        </CodeSurface>
        <LivePreview
          method="GET"
          path="/protocols/ondo-usdy"
          title="GET /api/v1/protocols/ondo-usdy"
        />
        <CodeSurface title="200 OK">
          {`{
  "slug": "ondo-usdy",
  "name": "Ondo USDY",
  "chain": "ethereum",
  "estimatedApyBps": 480,
  "snapshot": {
    "capturedAt": "2026-05-19T07:30:04.264Z",
    "nav": 1.10,
    "tvlUsd": 720245696,
    "apyBps": 480,
    "holderCount": null,
    "top10ConcentrationPct": null,
    "redemptionQueueUsd": null
  }
}`}
        </CodeSurface>
        <p>
          When the indexer hasn't captured a snapshot yet, <code>snapshot</code> is{" "}
          <code>null</code>.
        </p>
      </DocSection>

      <DocSection id="schema" title="Schemas">
        <h3 className="text-base font-sans font-normal text-white">Protocol</h3>
        <PropTable
          rows={[
            { name: "slug", type: "string", required: true, description: "Stable identifier — e.g. ondo-usdy" },
            { name: "name", type: "string", required: true, description: "Human-readable product name" },
            { name: "chain", type: '"ethereum" | "solana"', required: true, description: "Where the token lives" },
            { name: "category", type: "string", required: true, description: "us-treasuries, private-credit, money-market, emerging-markets, other" },
            { name: "contractAddress", type: "string", required: true, description: "ERC-20 address or Solana mint" },
            { name: "decimals", type: "integer", required: true, description: "Token decimals" },
            { name: "issuer", type: "{ name, jurisdiction }", description: "Issuer metadata" },
            { name: "estimatedApyBps", type: "integer", description: "APY in basis points (480 = 4.80%)" },
          ]}
        />
        <h3 className="text-base font-sans font-normal text-white pt-4">Snapshot</h3>
        <PropTable
          rows={[
            { name: "capturedAt", type: "ISO datetime", required: true, description: "When this row was written" },
            { name: "nav", type: "number", description: "Net asset value per token in USD" },
            { name: "tvlUsd", type: "number", description: "Total value locked = totalSupply * nav" },
            { name: "apyBps", type: "integer", description: "APY at snapshot time" },
            { name: "holderCount", type: "integer | null", description: "Currently null; holder-snapshot indexer planned" },
            { name: "top10ConcentrationPct", type: "number | null", description: "Currently null; tied to holder-snapshot indexer" },
            { name: "redemptionQueueUsd", type: "number | null", description: "Currently null; per-protocol fetchers on the roadmap" },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
