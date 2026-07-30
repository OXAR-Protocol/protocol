"use client";

import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/** Search box for a big catalog (stocks). Matches the hairline/lowercase idiom of
 *  the sector chips and `CustomSelect` — not a native `<select>`, not a new style. */
export function AssetSearchInput({ value, onChange, placeholder }: Props) {
  return (
    <div className="relative w-full max-w-[220px]">
      <Search
        size={13}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-full border border-black/15 bg-white py-1.5 pl-8 pr-8 text-[11px] lowercase tracking-wide text-black outline-none transition placeholder:text-black/35 focus:border-black/40"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/35 transition hover:text-black"
        >
          <X size={12} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
