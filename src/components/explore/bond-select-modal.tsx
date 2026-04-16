"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Search } from "lucide-react";
import { VAULT_CONFIGS } from "@oxar/sdk";

import { getBondName } from "@/lib/bond-labels";
import { BondRow } from "./bond-row";
import { BondPopular } from "./bond-popular";
import { BondFilterChip } from "./bond-filter-chip";

type CurrencyFilter = "ALL" | "UAH" | "USD" | "EUR";
type TypeFilter = "ALL" | "GOV" | "WAR";

interface BondSelectModalProps {
  open: boolean;
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const CURRENCY_CHIPS: CurrencyFilter[] = ["ALL", "UAH", "USD", "EUR"];
const TYPE_CHIPS: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "ALL" },
  { value: "GOV", label: "GOV" },
  { value: "WAR", label: "WAR" },
];

const POPULAR_IDS = ["UA-UAH-SHORT", "UA-USD-STD", "UA-UAH-WAR"];

export function BondSelectModal({
  open,
  selectedId,
  onClose,
  onSelect,
}: BondSelectModalProps) {
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState<CurrencyFilter>("ALL");
  const [type, setType] = useState<TypeFilter>("ALL");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VAULT_CONFIGS.filter((c) => {
      if (currency !== "ALL" && c.denomination !== currency) return false;
      if (type === "GOV" && c.isWar) return false;
      if (type === "WAR" && !c.isWar) return false;
      if (!q) return true;
      const haystack = [
        c.id,
        c.denomination,
        c.region,
        getBondName(c),
        `ox${c.denomination}`,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, currency, type]);

  const popular = useMemo(
    () => VAULT_CONFIGS.filter((c) => POPULAR_IDS.includes(c.id)),
    [],
  );

  if (!open) return null;

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[520px] max-h-[85vh] rounded-[5px] border border-white/10 bg-surface-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">
            Select Bond
          </span>
          <button
            onClick={onClose}
            className="p-1 text-white/30 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 border border-white/10 rounded-[5px] px-3 py-2.5 focus-within:border-white/30 transition-colors">
            <Search size={14} className="text-white/30 shrink-0" />
            <input
              type="text"
              autoFocus={false}
              placeholder="Search by name, currency, region"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 font-mono text-[16px] md:text-xs text-white placeholder:text-white/25"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {CURRENCY_CHIPS.map((chip) => (
              <BondFilterChip
                key={chip}
                active={currency === chip}
                onClick={() => setCurrency(chip)}
              >
                {chip}
              </BondFilterChip>
            ))}
            <div className="w-px h-4 bg-white/10 mx-1" />
            {TYPE_CHIPS.map((chip) => (
              <BondFilterChip
                key={chip.value}
                active={type === chip.value}
                onClick={() => setType(chip.value)}
              >
                {chip.label}
              </BondFilterChip>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!query && currency === "ALL" && type === "ALL" && (
            <BondPopular bonds={popular} onSelect={handleSelect} />
          )}

          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-white/25">
                All bonds
              </span>
              <span className="font-mono text-[10px] text-white/20">
                {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-[5px] p-8 text-center">
                <p className="font-mono text-xs text-white/30">No bonds found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filtered.map((c) => (
                  <BondRow
                    key={c.id}
                    config={c}
                    selected={c.id === selectedId}
                    onClick={() => handleSelect(c.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


