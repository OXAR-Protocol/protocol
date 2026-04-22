"use client";

import { ChangeEvent, forwardRef } from "react";

interface KeyInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  invalid?: boolean;
}

// Format: OXAR-XXXX-XXXX-XXXX
// Normalize raw input: uppercase, strip non-alphanumerics, insert dashes.
function formatKey(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  let body = cleaned;
  if (body.startsWith("OXAR")) body = body.slice(4);
  body = body.slice(0, 12);
  const groups: string[] = [];
  for (let i = 0; i < body.length; i += 4) {
    groups.push(body.slice(i, i + 4));
  }
  return `OXAR${groups.length ? "-" + groups.join("-") : ""}`;
}

export const KeyInput = forwardRef<HTMLInputElement, KeyInputProps>(
  function KeyInput({ value, onChange, onSubmit, disabled, invalid }, ref) {
    const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(formatKey(e.target.value));

    return (
      <input
        ref={ref}
        type="text"
        inputMode="text"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="characters"
        value={value}
        disabled={disabled}
        placeholder="OXAR-XXXX-XXXX-XXXX"
        onChange={handle}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        className={`w-full bg-transparent border outline-none font-mono tracking-[0.25em] text-center py-4 rounded-[4px] transition-colors ${
          invalid
            ? "border-[#A8222B] text-[#D4313C]"
            : "border-white/15 focus:border-white text-white placeholder:text-white/15 disabled:text-white/40"
        }`}
        style={{ fontSize: "16px", letterSpacing: "0.2em" }}
        aria-label="Access key"
      />
    );
  },
);
