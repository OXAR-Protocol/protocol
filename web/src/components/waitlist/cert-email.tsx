"use client";

import { ChangeEvent, forwardRef } from "react";

interface CertEmailProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

export const CertEmail = forwardRef<HTMLInputElement, CertEmailProps>(
  function CertEmail({ value, onChange, disabled, invalid }, ref) {
    const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

    return (
      <div className="relative flex items-baseline justify-center gap-2 max-w-[480px] mx-auto">
        <span className="font-sans italic text-white/40 text-[clamp(0.9rem,1.6vw,1.1rem)] leading-none whitespace-nowrap">
          This certifies that
        </span>
        <div className="relative flex-1 min-w-[140px]">
          <input
            ref={ref}
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            value={value}
            onChange={handle}
            disabled={disabled}
            placeholder="your@email.com"
            className={`w-full bg-transparent border-0 border-b outline-none font-mono italic text-[clamp(0.9rem,1.6vw,1.1rem)] leading-none pb-1 text-center transition-colors ${
              invalid
                ? "border-[#A8222B] text-[#D4313C]"
                : "border-white/30 focus:border-white text-white placeholder:text-white/20 disabled:text-white/50"
            }`}
            aria-label="Email address"
          />
        </div>
      </div>
    );
  },
);
