"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  narrow?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  narrow = false,
  disabled = false,
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const triggerLabel = selected?.label ?? placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-between gap-2 bg-black border border-white/10 hover:border-white/30 rounded px-3 py-1.5 font-mono text-sm text-white transition outline-none focus:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed ${
          narrow ? "min-w-[3.5rem]" : "min-w-[7rem]"
        } ${open ? "border-white/30" : ""}`}
      >
        <span className={narrow ? "text-center w-full" : "truncate"}>
          {triggerLabel}
        </span>
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          className={`shrink-0 text-white/40 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 min-w-full bg-black border border-white/15 rounded shadow-[0_8px_24px_rgba(0,0,0,0.6)] py-1 max-h-64 overflow-auto">
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 font-mono text-sm text-left hover:bg-white/[0.06] transition ${
                  isActive ? "text-white" : "text-white/70"
                }`}
              >
                <span className="flex flex-col">
                  <span>{opt.label}</span>
                  {opt.hint && (
                    <span className="font-mono text-[10px] text-white/30 mt-0.5">
                      {opt.hint}
                    </span>
                  )}
                </span>
                {isActive && (
                  <Check
                    size={12}
                    strokeWidth={2}
                    className="text-accent shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
