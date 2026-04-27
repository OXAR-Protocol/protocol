"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { PortfolioPosition } from "@/hooks/use-portfolio";
import { findVaultConfig, formatTokens } from "@/lib/format";
import { getBondColor } from "@/lib/bond-constants";
import { getBondName } from "@/lib/bond-labels";
import { TokenMark } from "@/components/explore/token-mark";

interface PositionSelectModalProps {
  open: boolean;
  positions: PortfolioPosition[];
  selectedVaultId: string;
  onClose: () => void;
  onSelect: (vaultId: string, position: PositionWithConfig) => void;
}

export interface PositionWithConfig {
  position: PortfolioPosition;
  vaultId: string;
}

export function PositionSelectModal({
  open,
  positions,
  selectedVaultId,
  onClose,
  onSelect,
}: PositionSelectModalProps) {
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

  if (!open) return null;

  const items: PositionWithConfig[] = positions
    .map((position) => {
      const config = findVaultConfig(position.vault.publicKey.toBase58());
      return config ? { position, vaultId: config.id } : null;
    })
    .filter((p): p is PositionWithConfig => p !== null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[460px] max-h-[80vh] rounded-[5px] border border-white/10 bg-surface-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">
            Select Position
          </span>
          <button
            onClick={onClose}
            className="p-1 text-white/30 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-[5px] p-8 text-center">
              <p className="font-mono text-xs text-white/30">
                No vault positions found.
              </p>
              <p className="font-mono text-[10px] text-white/20 mt-1">
                Deposit into a vault first.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {items.map((item) => {
                const config = findVaultConfig(
                  item.position.vault.publicKey.toBase58(),
                );
                if (!config) return null;
                const { color, rgb } = getBondColor(config.denomination);
                const selected = item.vaultId === selectedVaultId;

                return (
                  <button
                    key={item.vaultId}
                    onClick={() => {
                      onSelect(item.vaultId, item);
                      onClose();
                    }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-[5px] text-left transition-colors ${
                      selected ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <TokenMark
                      symbol={config.denomination}
                      color={color}
                      rgb={rgb}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-sm text-white">
                          ox{config.denomination}
                        </span>
                        {config.isWar && (
                          <span
                            className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded"
                            style={{ color, background: `rgba(${rgb},0.1)` }}
                          >
                            WAR
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-white/30 uppercase block truncate">
                        {getBondName(config)}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className="font-mono text-sm font-light tabular-nums"
                        style={{ color }}
                      >
                        {formatTokens(item.position.balance)}
                      </span>
                      <span className="font-mono text-[10px] text-white/25 block uppercase tracking-wide">
                        Balance
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
