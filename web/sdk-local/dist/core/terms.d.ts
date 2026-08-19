/**
 * Terms-of-use acceptance version.
 *
 * This is NOT a signature, and OXAR has no operating company to be the
 * counterparty for one. Recording an "acceptance" only evidences that a wallet
 * was shown a specific revision of /terms and took an affirmative action
 * afterward (see `web/src/components/intro-modal.tsx` + `api/terms/accept`) —
 * notice + act, at a version and a time. Nothing more.
 *
 * Bump this string when the terms change in a way that should require being
 * shown again. Acceptance rows are keyed by (wallet, version), so a wallet that
 * accepted an older value simply has no row for the new one — no migration or
 * deletion needed to make old acceptances "expire".
 *
 * Date-based, UTC, `YYYY-MM-DD`. Update alongside the "Last updated" date on
 * the terms page itself when the terms change.
 */
export declare const TERMS_VERSION = "2026-08-19";
