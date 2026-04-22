"use client";

import { ChangeEvent, ClipboardEvent, forwardRef } from "react";

interface KeyInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  invalid?: boolean;
}

// Format: OXAR-XXXX-XXXX-XXXX.
// Accepts any input, normalizes. Returns "" for empty input (so the user
// can fully erase the field).
export function formatKey(raw: string): string {
  let cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.startsWith("OXAR")) cleaned = cleaned.slice(4);
  cleaned = cleaned.slice(0, 12);
  if (cleaned.length === 0) return "";
  const groups: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    groups.push(cleaned.slice(i, i + 4));
  }
  return `OXAR-${groups.join("-")}`;
}

export const KeyInput = forwardRef<HTMLInputElement, KeyInputProps>(
  function KeyInput({ value, onChange, onSubmit, disabled, invalid }, ref) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
      onChange(formatKey(e.target.value));

    // Always replace on paste so a second paste wipes the first key instead
    // of concatenating and hitting the 12-char slice.
    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text");
      onChange(formatKey(pasted));
    };

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
        onChange={handleChange}
        onPaste={handlePaste}
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
