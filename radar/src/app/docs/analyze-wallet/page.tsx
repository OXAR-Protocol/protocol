import type { Metadata } from "next";

import { Callout, CodeSurface, DocPage, DocSection, PropTable } from "../_components/prose";

export const metadata: Metadata = {
  title: "Analyze wallet — OXAR Radar API",
};

const TOC = [
  { id: "request", label: "Request" },
  { id: "response", label: "Response" },
  { id: "risk-axes", label: "Risk axes" },
  { id: "caching", label: "Caching" },
];

export default function AnalyzeWalletPage() {
  return (
    <DocPage
      eyebrow="API Reference"
      title="Analyze wallet"
      description="POST endpoint that takes an Ethereum or Solana wallet address, computes its RWA exposure, and returns positions plus a four-axis risk score."
      toc={TOC}
    >
      <DocSection id="request" title="Request">
        <p>
          <code>POST /api/v1/analyze/wallet</code>. Body is JSON.
        </p>
        <PropTable
          rows={[
            { name: "address", type: "string", required: true, description: "Ethereum 0x… or Solana base58 address" },
            { name: "chains", type: 'string[] of "ethereum" | "solana"', description: "Defaults to inferring from address shape" },
            { name: "language", type: '"en" | "ru" | "pl"', description: "Locale for the AI explanation when requested" },
          ]}
        />
        <CodeSurface title="Example">
          {`curl -X POST https://radar.oxar.app/api/v1/analyze/wallet \\
  -H "Authorization: Bearer rdr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "chains": ["ethereum"]
  }'`}
        </CodeSurface>
      </DocSection>

      <DocSection id="response" title="Response">
        <CodeSurface title="200 OK">
          {`{
  "totalValueUsd": 153400,
  "weightedApyBps": 612,
  "positions": [
    {
      "protocolSlug": "ondo-usdy",
      "protocolName": "Ondo USDY",
      "chain": "ethereum",
      "balance": 90000,
      "valueUsd": 99000,
      "yieldApyBps": 480
    }
  ],
  "concentrationByProtocol": { "ondo-usdy": 0.645, "maple-finance": 0.355 },
  "concentrationByChain": { "ethereum": 1.0, "solana": 0 },
  "riskScore": {
    "overall": 6,
    "counterpartyRisk": "medium",
    "concentrationRisk": "medium",
    "smartContractRisk": "medium",
    "liquidityRisk": "medium"
  },
  "analyzedAt": 1779020201264
}`}
        </CodeSurface>
      </DocSection>

      <DocSection id="risk-axes" title="Risk axes">
        <p>
          The risk score is composed of four independent dimensions, each one of{" "}
          <code>low</code> / <code>medium</code> / <code>high</code> / <code>critical</code>.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Counterparty risk</strong> — solvency of the issuer. BlackRock and
            US-treasury-backed issuers sit at the low end.
          </li>
          <li>
            <strong>Concentration risk</strong> — share of the portfolio in a single
            protocol or single issuer.
          </li>
          <li>
            <strong>Smart contract risk</strong> — audit coverage, upgrade authority,
            time live, pause/freeze powers.
          </li>
          <li>
            <strong>Liquidity risk</strong> — redemption mechanics. Daily-redemption
            stables sit at the low end, weekly NAV-only withdrawals at the high.
          </li>
        </ul>
      </DocSection>

      <DocSection id="caching" title="Caching">
        <Callout>
          Wallet analyses are cached for <strong>5 minutes per address</strong>. A
          repeat request inside that window returns the same response without
          hitting Alchemy or Helius.
        </Callout>
        <p>
          Cache is per-wallet plus per-chain set. Asking for{" "}
          <code>chains: ["ethereum"]</code> and then <code>chains: ["ethereum", "solana"]</code>{" "}
          are two separate cache entries.
        </p>
      </DocSection>
    </DocPage>
  );
}
