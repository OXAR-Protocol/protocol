"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

import { useDropPlacement } from "@/hooks/use-drop-placement";

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
  /** `pill` matches the filter chips beside it — hairline, lowercase, tracked. */
  variant?: "default" | "pill";
  /** Which edge the menu hangs from. `right` for a control at the right edge of
   *  a row, where a wider-than-trigger menu would otherwise run off the screen. */
  align?: "left" | "right";
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  narrow = false,
  disabled = false,
  className = "",
  variant = "default",
  align = "left",
}: CustomSelectProps) {
  const pill = variant === "pill";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const drop = useDropPlacement(open, ref);

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
        className={`inline-flex items-center justify-between gap-2 border border-black/10 bg-white text-black transition outline-none hover:border-black/30 focus:border-black/40 disabled:cursor-not-allowed disabled:opacity-40 ${
          pill
            ? "rounded-full px-3 py-1.5 text-[11px] lowercase tracking-wide"
            : `rounded px-3 py-1.5 text-sm ${narrow ? "min-w-[3.5rem]" : "min-w-[7rem]"}`
        } ${open ? "border-black/30" : ""}`}
      >
        <span className={narrow && !pill ? "w-full text-center" : pill ? "whitespace-nowrap" : "truncate"}>
          {triggerLabel}
        </span>
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          className={`shrink-0 text-black/45 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          style={{ maxHeight: drop.maxHeight }}
          className={`absolute z-50 w-max min-w-full overflow-auto border border-black/15 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${
            pill ? "rounded-[10px]" : "rounded"
          } ${align === "right" ? "right-0" : "left-0"} ${
            drop.up ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
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
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-3 text-left transition hover:bg-black/[0.04] ${
                  pill ? "py-1.5 text-[12px] lowercase tracking-wide" : "py-2 text-sm"
                } ${isActive ? "text-black" : "text-black/70"}`}
              >
                <span className="flex flex-col">
                  <span>{opt.label}</span>
                  {opt.hint && (
                    <span className="text-[10px] text-black/40 mt-0.5">
                      {opt.hint}
                    </span>
                  )}
                </span>
                {isActive && (
                  <Check
                    size={12}
                    strokeWidth={2}
                    className="text-[#3c05c7] shrink-0"
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
