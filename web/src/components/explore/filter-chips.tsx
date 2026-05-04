"use client";

const FILTERS = ["All", "UAH", "USD", "EUR", "Highest APY", "Short-term"];

interface FilterChipsProps {
  active: string;
  onChange: (filter: string) => void;
}

export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {FILTERS.map((filter) => {
        const isActive = filter === active;
        return (
          <button
            key={filter}
            onClick={() => onChange(filter)}
            className={`shrink-0 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
              isActive
                ? "bg-accent text-white"
                : "border border-white/[0.08] text-white/40 hover:text-white/60"
            }`}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
