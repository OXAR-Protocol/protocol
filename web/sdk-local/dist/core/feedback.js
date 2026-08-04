"use strict";
/**
 * In-app feedback: what a report may contain, and what it reads like when it
 * lands. Pure — no transport, no framework — so the web app and a future mobile
 * app describe a report the same way instead of inventing two shapes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEEDBACK_LIMITS = void 0;
exports.parseFeedback = parseFeedback;
exports.formatFeedbackMessage = formatFeedbackMessage;
/** Caps. This arrives at a public endpoint, so every field is bounded before it
 *  reaches a log or a chat message. */
exports.FEEDBACK_LIMITS = {
    message: 2000,
    contact: 120,
    wallet: 64,
    route: 120,
    language: 8,
    userAgent: 200,
    build: 40,
};
const clip = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
/**
 * Validate and clip an untrusted payload. Returns null when there's nothing
 * worth sending — an empty message is not a report.
 */
function parseFeedback(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const body = raw;
    const message = clip(body.message, exports.FEEDBACK_LIMITS.message);
    if (!message)
        return null;
    const kind = body.kind === "bug" ? "bug" : "idea";
    const contact = clip(body.contact, exports.FEEDBACK_LIMITS.contact);
    const rawContext = (body.context ?? {});
    const context = {
        wallet: clip(rawContext.wallet, exports.FEEDBACK_LIMITS.wallet) || undefined,
        route: clip(rawContext.route, exports.FEEDBACK_LIMITS.route) || undefined,
        language: clip(rawContext.language, exports.FEEDBACK_LIMITS.language) || undefined,
        userAgent: clip(rawContext.userAgent, exports.FEEDBACK_LIMITS.userAgent) || undefined,
        build: clip(rawContext.build, exports.FEEDBACK_LIMITS.build) || undefined,
    };
    return { kind, message, contact: contact || undefined, context };
}
/**
 * The report as a chat message. Deliberately PLAIN TEXT: sent with no parse
 * mode, so nothing a person types can be read as markup by the receiving client.
 * The label leads, because triage is "is this a break or a wish" before anything
 * else.
 */
function formatFeedbackMessage(feedback) {
    const { kind, message, contact, context } = feedback;
    const lines = [kind === "bug" ? "🔴 BUG" : "💡 IDEA", "", message, ""];
    if (contact)
        lines.push(`reply to: ${contact}`);
    if (context?.wallet)
        lines.push(`wallet: ${context.wallet}`);
    if (context?.route)
        lines.push(`screen: ${context.route}`);
    if (context?.language)
        lines.push(`lang: ${context.language}`);
    if (context?.build)
        lines.push(`build: ${context.build}`);
    if (context?.userAgent)
        lines.push(`device: ${context.userAgent}`);
    return lines.join("\n");
}
