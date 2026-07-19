"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { INVITE_FLAG, CAPTURED_FLAG, DISMISSED_FLAG } from "./invite";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Soft email-capture popup for people who arrived via an invite link (they cleared
 * the wall without an email). Asks once, framed as "be first to know" — on submit it
 * adds them to the waitlist (/api/waitlist, reuses the referral logic) AND the
 * allowlist (/api/access/join, so access persists across devices). Never blocks: they
 * already have access, so "maybe later" just closes it and never nags again.
 */
export function JoinCapture() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const ls = window.localStorage;
      const should =
        ls.getItem(INVITE_FLAG) && !ls.getItem(CAPTURED_FLAG) && !ls.getItem(DISMISSED_FLAG);
      if (should) {
        // Small delay so it doesn't slam the user the instant the app paints.
        const t = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const valid = EMAIL_RE.test(email.trim());

  const submit = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || busy) return;
    setBusy(true);
    const opts = (body: object) => ({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    try {
      // Waitlist (referral logic) + allowlist (cross-device access) in parallel;
      // either failing shouldn't block the other or the friendly "done" state.
      await Promise.allSettled([
        fetch("/api/waitlist", opts({ email: value })),
        fetch("/api/access/join", opts({ email: value })),
      ]);
      try {
        window.localStorage.setItem(CAPTURED_FLAG, "1");
      } catch {
        /* ignore */
      }
      setDone(true);
      setTimeout(() => setShow(false), 1500);
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_FLAG, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-[380px] overflow-hidden rounded-[18px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 text-black/40 transition hover:text-black"
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            {/* Hero — the "money resting on a cloud" collage on a soft brand tint. */}
            <div className="flex justify-center bg-[#3c05c7]/[0.06] px-4 pt-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/join-cloud.webp" alt="" className="h-60 w-auto max-w-full object-contain" />
            </div>

            <div className="px-6 pb-6 pt-5">
              {done ? (
                <p className="py-6 text-center text-[15px] text-black">
                  You&apos;re in. We&apos;ll keep you posted. 👋
                </p>
              ) : (
                <>
                  <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-black">
                    You&apos;re early.
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-snug text-black/55">
                    Drop your email — be first to know when big updates land, and we&apos;ll lock
                    in your access across devices.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      placeholder="you@email.com"
                      inputMode="email"
                      className="w-full rounded-[12px] border border-black/15 px-3.5 py-3 text-[15px] outline-none placeholder:text-black/30 focus:border-black/40"
                    />
                    <button
                      onClick={submit}
                      disabled={!valid || busy}
                      className="w-full rounded-full bg-black py-3 text-[14px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-40"
                    >
                      {busy ? "…" : "keep me posted"}
                    </button>
                    <button
                      onClick={dismiss}
                      className="mt-1 text-[12px] lowercase tracking-wide text-black/40 transition hover:text-black/70"
                    >
                      maybe later
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
