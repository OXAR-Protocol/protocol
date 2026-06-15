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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <span className="lowercase text-[14px] text-black/35">loading…</span>
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
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white px-6 text-black"
      >
        <div className="relative flex w-full max-w-[440px] flex-col items-center gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="lowercase text-[clamp(15px,1.4vw,18px)] text-black/45">
              [ early access ]
            </span>
            <h1 className="lowercase text-[clamp(34px,6vw,56px)] leading-[1.0] tracking-[-0.04em] text-black">
              enter your key
            </h1>
            <p className="mt-1 max-w-[340px] lowercase text-[clamp(14px,1.3vw,16px)] leading-snug text-black/45">
              oxar is in closed alpha. paste the invite key you received.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex w-full flex-col gap-3"
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
              className="w-full rounded-full bg-black py-4 lowercase text-[15px] font-medium text-white transition-all hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30"
            >
              {redeeming ? "unlocking…" : "unlock"}
            </button>

            {error && (
              <span className="lowercase text-[13px] text-[#dc2626]">
                {errorCopy(error)}
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex w-full flex-col items-center gap-2 border-t border-black/10 pt-5"
          >
            <span className="lowercase text-[13px] text-black/40">
              don&apos;t have a key?
            </span>
            <a
              href="https://oxar.app/#waitlist"
              className="lowercase text-[13px] text-black/70 underline decoration-1 underline-offset-4 transition-colors hover:text-black"
            >
              join the waitlist →
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
