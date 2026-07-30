import { TERMS_VERSION } from "@oxar/sdk";
import { DocPage } from "@/components/landing-v2/doc-page";
import { TERMS_SECTIONS } from "@/components/terms/terms-sections";

export const metadata = {
  title: "OXAR — Terms of Use",
};

// Single source of truth for "which revision is live": TERMS_VERSION also
// gates the acceptance record taken from the welcome card (see
// components/intro-modal.tsx + api/terms/accept). Keep this display in sync
// with that constant rather than hand-editing a date here — bump both
// together when the terms materially change.
const lastUpdated = new Date(`${TERMS_VERSION}T00:00:00Z`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default function TermsPage() {
  return (
    <DocPage label="legal" title="terms of use">
      <p><strong>Last updated:</strong> {lastUpdated}</p>

      {/* Section prose lives once, in terms-sections.tsx — shared with the
       *  in-app gate modal (see TermsGateModal) so the two can never drift. */}
      {TERMS_SECTIONS.map((s) => (
        <section key={s.id} id={s.id}>
          <h2>{s.heading}</h2>
          {s.body}
        </section>
      ))}
    </DocPage>
  );
}
