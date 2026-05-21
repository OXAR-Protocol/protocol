"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Older browsers; quietly ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-white/10 bg-surface-1 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/60 transition hover:border-white/25 hover:text-white"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}
