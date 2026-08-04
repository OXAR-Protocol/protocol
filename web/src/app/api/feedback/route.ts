import { NextRequest, NextResponse } from "next/server";

import { parseFeedback, formatFeedbackMessage, FEEDBACK_LIMITS } from "@oxar/sdk";

/**
 * In-app feedback → a Telegram message.
 *
 * A database was the obvious answer and the wrong one: a table nobody opens is
 * the same as no feedback channel at all. Telegram's bot API is free, has no
 * schema to migrate, and lands where the person who can act on it already looks.
 *
 * The report is ALSO written to the platform log, so a missing token or a
 * Telegram outage loses a build's worth of reports instead of all of them.
 */
export const runtime = "nodejs";

const TELEGRAM_API = "https://api.telegram.org";

/** A public endpoint that pushes into someone's chat is a flood vector. This is
 *  per-instance and therefore leaky, but it stops the trivial case at no cost. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  // The map would otherwise grow for the lifetime of the instance.
  if (recent.size > 500) {
    for (const [k, v] of recent) if (v.every((t) => now - t >= WINDOW_MS)) recent.delete(k);
  }
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many reports — try again later" }, { status: 429 });
  }

  let feedback;
  try {
    feedback = parseFeedback(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!feedback) return NextResponse.json({ error: "Say something first" }, { status: 400 });

  // The build is attached here, not sent by the client: the client can't be
  // trusted about which code it's running, and Vercel hands it to us for free.
  feedback.context = {
    ...feedback.context,
    build: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, FEEDBACK_LIMITS.build),
    userAgent: req.headers.get("user-agent")?.slice(0, FEEDBACK_LIMITS.userAgent) ?? undefined,
  };
  const text = formatFeedbackMessage(feedback);

  // Backup copy. Written before the send, so it survives a Telegram failure.
  console.log("[feedback]", text.replace(/\n/g, " | "));

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("[feedback] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — log only");
    // `delivered` says whether it reached the chat, and it is the whole point of
    // reporting it: this endpoint answered a cheerful `ok` for two hours while a
    // deployment older than the environment variables quietly dropped every
    // report on the floor. A caller can now see that from the outside.
    return NextResponse.json({ ok: true, delivered: false });
  }

  let delivered = true;
  try {
    // No parse_mode: the message is plain text, so nothing a person types can be
    // read as markup by the receiving client.
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      // Never echo the response: the URL it describes contains the bot token.
      console.error("[feedback] telegram rejected the message", res.status);
      delivered = false;
    }
  } catch (err) {
    console.error("[feedback] telegram unreachable", err instanceof Error ? err.message : err);
    delivered = false;
  }

  // The report is already saved to the log, so the person is thanked either way.
  return NextResponse.json({ ok: true, delivered });
}
