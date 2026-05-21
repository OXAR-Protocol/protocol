import type { Metadata } from "next";

import { Callout, CodeSurface, DocPage, DocSection } from "../_components/prose";

export const metadata: Metadata = {
  title: "Rate limits — OXAR Radar",
};

const TOC = [
  { id: "preview-limits", label: "Free preview limits" },
  { id: "headers", label: "Response headers" },
  { id: "exceeded", label: "When you're over" },
  { id: "higher", label: "Need more?" },
];

export default function RateLimitsPage() {
  return (
    <DocPage
      eyebrow="Getting started"
      title="Rate limits"
      description="One sliding-window limiter per key. Friendly headers on every response. Clear 429 when you're over."
      toc={TOC}
    >
      <DocSection id="preview-limits" title="Free preview limits">
        <p>
          During the public preview every self-serve key is capped at:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>60 requests per minute</strong> — sliding window, not a hard top
            of minute reset.
          </li>
          <li>
            <strong>10,000 requests per month</strong> — counted over the calendar
            month in UTC.
          </li>
        </ul>
        <p>
          Both endpoints under <code>/api/v1/*</code> count toward the same limit.
        </p>
      </DocSection>

      <DocSection id="headers" title="Response headers">
        <p>Every <code>/api/v1/*</code> response carries:</p>
        <CodeSurface title="Headers">
          {`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1779020201
X-Api-Key-Tier: free`}
        </CodeSurface>
        <p>
          <code>X-RateLimit-Reset</code> is a Unix timestamp in seconds. Subtract{" "}
          <code>Date.now() / 1000</code> to get seconds until the window resets.
        </p>
      </DocSection>

      <DocSection id="exceeded" title="When you're over">
        <p>
          We respond with <code>429</code> and include a <code>Retry-After</code>{" "}
          header in seconds. The body is JSON:
        </p>
        <CodeSurface title="429 body">
          {`{
  "error": "rate_limited",
  "resetAt": 1779020261
}`}
        </CodeSurface>
        <Callout kind="warn">
          The limiter uses Upstash Redis in production. In local dev it falls back
          to an in-memory window, which means limits don't survive process restarts.
        </Callout>
      </DocSection>

      <DocSection id="higher" title="Need more?">
        <p>
          Higher limits (millions of requests, custom monthly quotas, SLA) are
          issued out-of-band while paid plans are paused. Email{" "}
          <a href="mailto:support@oxar.app">support@oxar.app</a> with what you're
          building and we'll set you up.
        </p>
      </DocSection>
    </DocPage>
  );
}
