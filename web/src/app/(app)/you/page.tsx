"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { Copy, Check, LogOut, Zap, ArrowUpRight, LineChart } from "lucide-react";

import { SectionLabel } from "@/components/section-label";

type TemplateKey = "sleepy" | "walking" | "running";

const TEMPLATE_LABELS: Record<TemplateKey, { emoji: string; label: string }> = {
  sleepy: { emoji: "😴", label: "Sleepy" },
  walking: { emoji: "🚶", label: "Walking" },
  running: { emoji: "🏃", label: "Running" },
};

export default function YouPage() {
  const { user, logout, ready, authenticated } = usePrivy();
  const [copied, setCopied] = useState(false);
  const [template, setTemplate] = useState<TemplateKey>("walking");

  const email = user?.email?.address;
  const wallet = user?.wallet?.address;
  const shortWallet = wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-6)}` : "";

  const handleCopy = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!ready) return null;

  return (
    <div className="max-w-[800px] mx-auto pt-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>You</SectionLabel>
        <h1 className="mt-4 font-sans text-3xl md:text-4xl text-white leading-tight">
          Settings & profile
        </h1>
      </motion.div>

      {/* Account */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
          Account
        </p>
        <div className="space-y-3">
          {email && (
            <Row label="Email" value={email} />
          )}
          {wallet && (
            <div className="flex items-center justify-between p-4 rounded-[5px] border border-white/10">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-white/30">
                  Wallet
                </p>
                <p className="mt-1 font-mono text-sm text-white">
                  {shortWallet}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/15 hover:border-white/30 font-mono text-[11px] uppercase tracking-wide text-white/60 hover:text-white transition"
              >
                {copied ? (
                  <>
                    <Check size={12} strokeWidth={1.5} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} strokeWidth={1.5} />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
          {!authenticated && (
            <div className="p-4 rounded-[5px] border border-white/10 text-center font-mono text-sm text-white/40">
              You're signed out
            </div>
          )}
        </div>
      </motion.section>

      {/* Risk template */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
          Default speed
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TEMPLATE_LABELS) as TemplateKey[]).map((key) => {
            const meta = TEMPLATE_LABELS[key];
            const isActive = template === key;
            return (
              <button
                key={key}
                onClick={() => setTemplate(key)}
                className={`p-4 rounded-[5px] border transition flex flex-col items-center gap-2 ${
                  isActive
                    ? "border-accent/40 bg-accent/[0.04]"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <span className="text-2xl">{meta.emoji}</span>
                <span className="font-mono text-xs uppercase tracking-wide text-white">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-[11px] text-white/30">
          Per-vault risk overrides this default
        </p>
      </motion.section>

      {/* Rules link */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18 }}
        className="mt-10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
          Automation
        </p>
        <div className="space-y-3">
          <Link
            href="/rules"
            className="block p-5 rounded-[5px] border border-white/10 hover:border-white/30 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Zap className="text-accent mt-0.5" size={18} strokeWidth={1.5} />
                <div>
                  <p className="font-sans text-base text-white">
                    Sleeping patterns
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/40">
                    Auto-distribute when money moves in your wallet
                  </p>
                </div>
              </div>
              <ArrowUpRight
                className="text-white/30 group-hover:text-white transition"
                size={16}
                strokeWidth={1.5}
              />
            </div>
          </Link>

          <Link
            href="/markets"
            className="block p-5 rounded-[5px] border border-white/10 hover:border-white/30 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <LineChart className="text-accent mt-0.5" size={18} strokeWidth={1.5} />
                <div>
                  <p className="font-sans text-base text-white">
                    Markets
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/40">
                    Browse every yield source we route to
                  </p>
                </div>
              </div>
              <ArrowUpRight
                className="text-white/30 group-hover:text-white transition"
                size={16}
                strokeWidth={1.5}
              />
            </div>
          </Link>
        </div>
      </motion.section>

      {/* Notifications */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
          Notifications
        </p>
        <div className="space-y-2">
          <Toggle label="Pile activity" description="Someone joined or pulled their share" defaultOn />
          <Toggle label="Daily yield digest" description="One line, once a day" defaultOn />
          <Toggle label="Goal milestones" description="When you cross 25 / 50 / 75 / 100%" defaultOn />
        </div>
      </motion.section>

      {/* Sign out */}
      {authenticated && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[5px] border border-white/15 hover:border-red-500/40 hover:text-red-400 font-mono text-xs uppercase tracking-wide text-white/60 transition"
          >
            <LogOut size={12} strokeWidth={1.5} />
            Sign out
          </button>
        </motion.section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-[5px] border border-white/10">
      <p className="font-mono text-xs uppercase tracking-wide text-white/30">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-white">{value}</p>
    </div>
  );
}

function Toggle({
  label,
  description,
  defaultOn,
}: {
  label: string;
  description: string;
  defaultOn: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className="w-full p-4 rounded-[5px] border border-white/10 hover:border-white/20 transition flex items-center justify-between text-left"
    >
      <div>
        <p className="font-sans text-sm text-white">{label}</p>
        <p className="mt-0.5 font-mono text-xs text-white/40">{description}</p>
      </div>
      <span
        className={`relative inline-block w-10 h-5 rounded-full transition-colors ${
          on ? "bg-accent/40" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
