import Link from "next/link";
import type { Metadata } from "next";

import { Callout, CodeSurface, DocPage, DocSection } from "../_components/prose";

export const metadata: Metadata = {
  title: "Authentication — OXAR Radar",
};

const TOC = [
  { id: "bearer-tokens", label: "Bearer tokens" },
  { id: "minting", label: "Minting a key" },
  { id: "rotation", label: "Rotation & revocation" },
  { id: "storing", label: "Storing keys safely" },
];

export default function AuthenticationPage() {
  return (
    <DocPage
      eyebrow="Getting started"
      title="Authentication"
      description="Every /api/v1/* request needs an API key in the Authorization header. Public-demo endpoints (/api/analyze) are rate-limited by IP and don't require a key."
      toc={TOC}
    >
      <DocSection id="bearer-tokens" title="Bearer tokens">
        <p>
          Pass your key as a bearer token. Keys start with <code>rdr_live_</code> and
          carry 128 bits of entropy.
        </p>
        <CodeSurface title="Authorization header">
          {`Authorization: Bearer rdr_live_k_oZWWMEhiKHmuUdzh28Qg`}
        </CodeSurface>
        <Callout>
          Keys are hashed with SHA-256 in our database. The plaintext key is shown
          exactly once at mint time — store it immediately.
        </Callout>
      </DocSection>

      <DocSection id="minting" title="Minting a key">
        <p>
          Sign in at <Link href="/dashboard">/dashboard</Link> with Privy (email,
          wallet, or social login). Click <em>Mint free key</em>. The raw token appears
          once — copy it into your password manager or your <code>.env</code> file.
        </p>
        <p>
          During the public preview every self-serve key is on the free tier:{" "}
          <strong>60 requests per minute, 10k per month</strong>. Higher limits are
          available out-of-band — email <a href="mailto:support@oxar.app">support@oxar.app</a>.
        </p>
      </DocSection>

      <DocSection id="rotation" title="Rotation & revocation">
        <p>
          You can mint as many keys as you need and revoke any one of them from the
          dashboard. Revoked keys start returning <code>401 invalid_api_key</code>{" "}
          immediately — there's no grace period, so rotate clients before you click
          revoke.
        </p>
      </DocSection>

      <DocSection id="storing" title="Storing keys safely">
        <p>
          Treat Radar keys like any third-party API credential.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Never commit them to git, even in private repos.</li>
          <li>Don't paste them into client-side bundles or browser extensions.</li>
          <li>
            Server-side only: keep them in <code>.env</code> files and platform
            secret stores (Vercel, Railway, Doppler, 1Password CLI).
          </li>
          <li>If you suspect a leak, revoke and rotate.</li>
        </ul>
      </DocSection>
    </DocPage>
  );
}
