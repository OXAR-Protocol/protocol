"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useAccessGate } from "@/hooks/use-access-gate";
import { KeyInput } from "./key-input";

const KEY_RE = /^OXAR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

interface AccessGateProps {
  children: ReactNode;
}

export function AccessGate({ children }: AccessGateProps) {
  const { state, redeeming, error, redeem } = useAccessGate();
  const [key, setKey] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const autoTried = useRef(false);
  const searchParams = useSearchParams();

  // Pre-fill ?k= from URL and auto-submit once when unlocked state resolves.
  useEffect(() => {
    if (state.kind !== "locked" || autoTried.current) return;
    const q = searchParams.get("k")?.toUpperCase().trim() ?? "";
    if (q.length === 0) return;
    autoTried.current = true;
    if (KEY_RE.test(q)) {
      setKey(q);
      redeem(q);
    }
  }, [state.kind, searchParams, redeem]);

  const submit = async () => {
    if (!KEY_RE.test(key) || redeeming) return;
    await redeem(key);
  };

  const isValid = KEY_RE.test(key);

  if (state.kind === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-surface-0 flex items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/30">
          Loading
        </span>
      </div>
    );
  }

  if (state.kind === "unlocked") return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="gate"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 bg-surface-0 flex items-center justify-center px-6 overflow-hidden"
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(114,162,240,0.1), rgba(139,92,246,0.05), transparent)",
          }}
        />

        <div className="relative w-full max-w-[440px] flex flex-col items-center text-center gap-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/30">
              Restricted · Early Access
            </span>
            <h1 className="font-sans font-normal text-[clamp(1.8rem,5vw,2.4rem)] leading-[1.1] text-white">
              Enter your key
            </h1>
            <p className="font-mono text-[11px] text-white/40 leading-relaxed max-w-[340px] mt-1">
              OXAR is in closed alpha. Paste the invite key you received.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full flex flex-col gap-3"
          >
            <KeyInput
              ref={inputRef}
              value={key}
              onChange={setKey}
              onSubmit={submit}
              disabled={redeeming}
              invalid={Boolean(error)}
            />

            <button
              onClick={submit}
              disabled={!isValid || redeeming}
              className="w-full py-4 rounded-[4px] font-mono text-[11px] uppercase tracking-[0.25em] bg-white text-surface-0 hover:bg-white/90 disabled:bg-white/[0.06] disabled:text-white/30 disabled:cursor-not-allowed transition-all"
            >
              {redeeming ? "Unlocking…" : "Unlock"}
            </button>

            {error && (
              <span className="font-mono text-[10px] text-[#D4313C]">
                {errorCopy(error)}
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col items-center gap-2 pt-4 border-t border-white/[0.06] w-full"
          >
            <span className="font-mono text-[10px] text-white/30">
              Don&apos;t have a key?
            </span>
            <a
              href="https://oxar.app/#waitlist"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-white transition-colors"
            >
              Join the waitlist →
            </a>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function errorCopy(err: string): string {
  if (err === "Key revoked") return "This key has been revoked.";
  if (err === "Unknown key") return "Key not recognized.";
  if (err === "Invalid key format") return "Key format: OXAR-XXXX-XXXX-XXXX.";
  if (err === "Too many attempts") return "Too many attempts. Wait a few minutes.";
  return err;
}
