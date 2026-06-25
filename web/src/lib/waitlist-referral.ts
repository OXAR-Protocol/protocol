import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Spots a referred friend starts ahead. MUST stay <= the SQL GAIN (5) in
// 0004_waitlist_referral.sql so the inviter always ranks ahead of their invitee.
export const HEAD_START = 3;

// Generate a short, URL-safe, unambiguous share code (no 0/O/1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRefCode(): string {
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[bytes[i]! % ALPHABET.length];
  return code;
}

export function normalizeRefCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : null;
}

// Curated list of the most common disposable/temp-mail domains. Not exhaustive —
// Turnstile is the real bot defense; this just cuts the cheapest farming.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "temp-mail.org",
  "tempmail.com", "throwawaymail.com", "yopmail.com", "getnada.com",
  "trashmail.com", "fakeinbox.com", "maildrop.cc", "dispostable.com",
  "sharklasers.com", "guerrillamailblock.com", "grr.la", "spam4.me",
  "tempr.email", "mohmal.com", "emailondeck.com", "mailnesia.com",
  "mintemail.com", "tempinbox.com", "33mail.com", "burnermail.io",
  "temp-mail.io", "tmpmail.org", "moakt.com", "mailcatch.com",
  "inboxbear.com", "luxusmail.org", "tempmailo.com", "1secmail.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

export interface Rank {
  position: number;
  total: number;
  referrals: number;
}

// Effective queue standing for a share code, via the SQL rank function.
export async function fetchRank(
  supabase: SupabaseClient,
  refCode: string,
): Promise<Rank | null> {
  const { data } = await supabase.rpc("oxar_waitlist_rank", { p_ref_code: refCode });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  // SQL column is `pos` ("position" is a reserved Postgres keyword).
  return {
    position: Number(row.pos),
    total: Number(row.total),
    referrals: Number(row.referrals),
  };
}

// Verify a Cloudflare Turnstile token. Returns true when the captcha is not
// configured (TURNSTILE_SECRET_KEY unset) so build/local work without an account.
export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || token.length === 0) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
