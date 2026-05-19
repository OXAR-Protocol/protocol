import Link from "next/link";
import type { Metadata } from "next";

import { CodeSurface, DocPage, DocSection } from "./_components/prose";

export const metadata: Metadata = {
  title: "Overview — OXAR Radar API",
  description:
    "Intro to the OXAR Radar REST API: what it is, what's in it, how to call it.",
};

const TOC = [
  { id: "what-radar-does", label: "What Radar does" },
  { id: "concepts", label: "Concepts" },
  { id: "quickstart", label: "Quickstart" },
  { id: "next", label: "Next steps" },
];

export default function OverviewPage() {
  return (
    <DocPage
      eyebrow="Getting started"
      title="OXAR Radar API"
      description="Real-time RWA market intelligence for Solana and Ethereum. Wallet positions, protocol snapshots, AI explanations — all queryable in JSON, refreshed every five minutes."
      toc={TOC}
    >
      <DocSection id="what-radar-does" title="What Radar does">
        <p>
          Radar indexes every major RWA issuer on Ethereum and Solana —{" "}
          <strong>BlackRock BUIDL, Ondo USDY/OUSG, Maple, Centrifuge, Backed, and OXAR</strong>{" "}
          — and exposes their <code>NAV</code>, <code>TVL</code>, holder data, and discrete
          events through a single REST API.
        </p>
        <p>
          Two kinds of consumers use it: <strong>builders</strong> who need clean data
          for their own UI, and <strong>analysts</strong> who pipe responses into spreadsheets,
          Jupyter notebooks, or BI dashboards.
        </p>
      </DocSection>

      <DocSection id="concepts" title="Concepts">
        <p>
          A <strong>protocol</strong> is a single tokenised issuer on a single chain. Each
          protocol has a slug like <code>ondo-usdy</code> or <code>blackrock-buidl</code>.
        </p>
        <p>
          A <strong>snapshot</strong> is the protocol's state at one point in time. Radar
          captures a snapshot every five minutes via Vercel Cron. Snapshots are immutable
          and append-only.
        </p>
        <p>
          An <strong>analysis</strong> is a wallet-level read computed on demand. It groups
          a wallet's RWA positions, scores risk, and optionally generates a plain-language
          explanation via Claude Haiku.
        </p>
      </DocSection>

      <DocSection id="quickstart" title="Quickstart">
        <p>
          1. Sign in at <Link href="/dashboard">/dashboard</Link> and mint a key.
        </p>
        <p>2. Hit the API with your bearer token:</p>
        <CodeSurface title="cURL · list protocols">
          {`curl https://radar.oxar.app/api/v1/protocols \\
  -H "Authorization: Bearer rdr_live_..."`}
        </CodeSurface>
        <p>
          You'll get a JSON response with every protocol Radar tracks. From there, jump
          to <Link href="/docs/protocols">Protocols</Link> for the full schema.
        </p>
      </DocSection>

      <DocSection id="next" title="Next steps">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/docs/authentication">Authentication</Link> — bearer-token format
            and rotation
          </li>
          <li>
            <Link href="/docs/rate-limits">Rate limits</Link> — the free preview limits
            and response headers
          </li>
          <li>
            <Link href="/docs/protocols">Protocols API</Link> — endpoints and response
            schemas
          </li>
          <li>
            <Link href="/docs/analyze-wallet">Analyze wallet</Link> — POST endpoint for
            on-demand portfolio reads
          </li>
        </ul>
      </DocSection>
    </DocPage>
  );
}
