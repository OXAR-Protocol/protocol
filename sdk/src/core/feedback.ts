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
export const FEEDBACK_LIMITS = {
  message: 2000,
  contact: 120,
  wallet: 64,
  route: 120,
  language: 8,
  userAgent: 200,
  build: 40,
} as const;

const clip = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * Validate and clip an untrusted payload. Returns null when there's nothing
 * worth sending — an empty message is not a report.
 */
export function parseFeedback(raw: unknown): Feedback | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;

  const message = clip(body.message, FEEDBACK_LIMITS.message);
  if (!message) return null;

  const kind: FeedbackKind = body.kind === "bug" ? "bug" : "idea";
  const contact = clip(body.contact, FEEDBACK_LIMITS.contact);

  const rawContext = (body.context ?? {}) as Record<string, unknown>;
  const context: FeedbackContext = {
    wallet: clip(rawContext.wallet, FEEDBACK_LIMITS.wallet) || undefined,
    route: clip(rawContext.route, FEEDBACK_LIMITS.route) || undefined,
    language: clip(rawContext.language, FEEDBACK_LIMITS.language) || undefined,
    userAgent: clip(rawContext.userAgent, FEEDBACK_LIMITS.userAgent) || undefined,
    build: clip(rawContext.build, FEEDBACK_LIMITS.build) || undefined,
  };

  return { kind, message, contact: contact || undefined, context };
}

/**
 * The report as a chat message. Deliberately PLAIN TEXT: sent with no parse
 * mode, so nothing a person types can be read as markup by the receiving client.
 * The label leads, because triage is "is this a break or a wish" before anything
 * else.
 */
export function formatFeedbackMessage(feedback: Feedback): string {
  const { kind, message, contact, context } = feedback;
  const lines = [kind === "bug" ? "🔴 BUG" : "💡 IDEA", "", message, ""];

  if (contact) lines.push(`reply to: ${contact}`);
  if (context?.wallet) lines.push(`wallet: ${context.wallet}`);
  if (context?.route) lines.push(`screen: ${context.route}`);
  if (context?.language) lines.push(`lang: ${context.language}`);
  if (context?.build) lines.push(`build: ${context.build}`);
  if (context?.userAgent) lines.push(`device: ${context.userAgent}`);

  return lines.join("\n");
}
