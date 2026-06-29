"use client";

import { useCallback, useEffect, useState } from "react";
import { useWaitlist } from "@/hooks/use-waitlist";
import { Turnstile, TURNSTILE_ENABLED } from "./turnstile";
import { WaitlistSuccess } from "./waitlist-success";

// The waitlist sign-up form + success state. Reused by the landing page and the
// closed-alpha "coming soon" gate so both share the exact same referral logic
// (all of it lives in useWaitlist / the /api/waitlist route).
export function WaitlistForm({ initialEmail = "" }: { initialEmail?: string }) {
  const { status, error, submit, serial, shareUrl, rank, referred, incomingRef } =
    useWaitlist();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [token, setToken] = useState("");

  // Prefill the referral code when the visitor arrived via an invite link.
  useEffect(() => {
    if (incomingRef) setCode(incomingRef);
  }, [incomingRef]);

  // Adopt a late-arriving initial email (e.g. handed in from the access gate).
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const sealed = status === "sealed";
  const busy = status === "submitting";
  const blockedByCaptcha = TURNSTILE_ENABLED && !token;

  const onVerify = useCallback((t: string) => setToken(t), []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || sealed || blockedByCaptcha) return;
    submit(email.trim(), honeypot, token || undefined, code.trim() || undefined);
  };

  if (sealed) {
    return (
      <WaitlistSuccess
        serial={serial ?? 0}
        shareUrl={shareUrl}
        rank={rank}
        referred={referred}
      />
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-[520px] flex-col gap-3">
        {/* Honeypot — hidden from users; bots fill it and get silently dropped. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          aria-hidden
        />
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="h-12 w-full shrink-0 rounded-full border border-white/20 bg-transparent px-5 lowercase text-[16px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/60 md:w-auto md:flex-1"
          />
          <button
            type="submit"
            disabled={busy || blockedByCaptcha}
            className="h-12 shrink-0 rounded-full bg-white px-7 lowercase text-[16px] font-medium text-black transition-colors hover:bg-white/85 disabled:opacity-50"
          >
            {busy ? "claiming…" : "take my seat"}
          </button>
        </div>

        {incomingRef ? (
          <p className="lowercase text-[13px] text-white/45">
            invited by a friend — you&apos;ll start ahead.
          </p>
        ) : (
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="referral code (optional)"
            className="h-11 w-full rounded-full border border-white/15 bg-transparent px-5 lowercase text-[14px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-white/50"
          />
        )}

        <Turnstile onVerify={onVerify} />
      </form>

      {error && (
        <p className="mt-3 lowercase text-[14px] text-[#ff6b6b]">{error} — try again</p>
      )}
    </>
  );
}
