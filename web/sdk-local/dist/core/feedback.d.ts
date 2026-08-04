/**
 * In-app feedback: what a report may contain, and what it reads like when it
 * lands. Pure — no transport, no framework — so the web app and a future mobile
 * app describe a report the same way instead of inventing two shapes.
 */
/** A break and an idea want different follow-ups, so they arrive labelled. */
export type FeedbackKind = "bug" | "idea";
/** Gathered by the app, not typed by the person — half the bugs are otherwise
 *  unreproducible ("it didn't work" with no screen and no wallet). */
export interface FeedbackContext {
    /** Public wallet address. Public by definition; never a key. */
    wallet?: string;
    /** Which screen it was sent from. */
    route?: string;
    /** UI language at the time (en / uk) — a broken string is language-specific. */
    language?: string;
    /** Browser/OS string, clipped. */
    userAgent?: string;
    /** Build the person was actually on, attached server-side. */
    build?: string;
}
export interface Feedback {
    kind: FeedbackKind;
    message: string;
    /** How to reply — email or a @handle. Optional: demanding it costs reports. */
    contact?: string;
    context?: FeedbackContext;
}
/** Caps. This arrives at a public endpoint, so every field is bounded before it
 *  reaches a log or a chat message. */
export declare const FEEDBACK_LIMITS: {
    readonly message: 2000;
    readonly contact: 120;
    readonly wallet: 64;
    readonly route: 120;
    readonly language: 8;
    readonly userAgent: 200;
    readonly build: 40;
};
/**
 * Validate and clip an untrusted payload. Returns null when there's nothing
 * worth sending — an empty message is not a report.
 */
export declare function parseFeedback(raw: unknown): Feedback | null;
/**
 * The report as a chat message. Deliberately PLAIN TEXT: sent with no parse
 * mode, so nothing a person types can be read as markup by the receiving client.
 * The label leads, because triage is "is this a break or a wish" before anything
 * else.
 */
export declare function formatFeedbackMessage(feedback: Feedback): string;
