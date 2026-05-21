import type { Metadata } from "next";

import { CodeSurface, DocPage, DocSection } from "../_components/prose";

export const metadata: Metadata = {
  title: "Errors — OXAR Radar",
};

const TOC = [
  { id: "shape", label: "Error shape" },
  { id: "codes", label: "Error codes" },
  { id: "retrying", label: "Retrying" },
];

interface ErrorRow {
  status: number;
  code: string;
  meaning: string;
}

const ERRORS: readonly ErrorRow[] = [
  { status: 400, code: "invalid_json", meaning: "Request body wasn't valid JSON" },
  { status: 400, code: "invalid_address", meaning: "Wallet address isn't a valid Ethereum or Solana address" },
  { status: 400, code: "invalid_tier", meaning: "Unrecognised tier value on admin endpoints" },
  { status: 401, code: "missing_api_key", meaning: "Authorization header is missing or malformed" },
  { status: 401, code: "invalid_api_key", meaning: "Key is unknown or revoked" },
  { status: 401, code: "missing_token", meaning: "Dashboard endpoint received no Privy token" },
  { status: 401, code: "invalid_token", meaning: "Privy access token failed verification" },
  { status: 404, code: "not_found", meaning: "Unknown protocol slug or resource" },
  { status: 429, code: "rate_limited", meaning: "Per-minute or monthly quota hit. See Retry-After." },
  { status: 500, code: "internal_error", meaning: "Unhandled server error. Safe to retry once." },
  { status: 503, code: "server_not_configured", meaning: "An optional integration (Privy, etc.) hasn't been wired on this deployment" },
];

export default function ErrorsPage() {
  return (
    <DocPage
      eyebrow="Getting started"
      title="Errors"
      description="All non-2xx responses share the same JSON shape. The HTTP status code stays canonical; the body's code field is for programmatic branching."
      toc={TOC}
    >
      <DocSection id="shape" title="Error shape">
        <CodeSurface title="Example 401 body">
          {`{
  "error": "invalid_api_key"
}`}
        </CodeSurface>
        <p>
          A few endpoints add fields. <code>rate_limited</code> bodies include{" "}
          <code>resetAt</code> (Unix ms timestamp). <code>invalid_address</code>{" "}
          bodies in the public demo include the offending input.
        </p>
      </DocSection>

      <DocSection id="codes" title="Error codes">
        <div className="overflow-hidden rounded-[5px] border border-white/10">
          <div className="grid grid-cols-[80px_1fr_2fr] gap-4 border-b border-white/10 bg-surface-1 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            <span>Status</span>
            <span>Code</span>
            <span>Meaning</span>
          </div>
          {ERRORS.map((row, i) => (
            <div
              key={row.code}
              className={`grid grid-cols-[80px_1fr_2fr] gap-4 px-4 py-3 ${
                i !== ERRORS.length - 1 ? "border-b border-white/10" : ""
              }`}
            >
              <div className="font-mono text-[12px] text-white">{row.status}</div>
              <div className="font-mono text-[12px] text-accent">{row.code}</div>
              <div className="text-[13px] leading-relaxed text-white/70">{row.meaning}</div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="retrying" title="Retrying">
        <p>
          <code>500</code> and <code>503</code> are safe to retry with exponential
          backoff. <code>429</code> responses always carry a <code>Retry-After</code>{" "}
          header — respect it.
        </p>
        <p>
          <code>400</code>/<code>401</code>/<code>404</code> reflect a problem in the
          request itself; retrying without changes won't help.
        </p>
      </DocSection>
    </DocPage>
  );
}
