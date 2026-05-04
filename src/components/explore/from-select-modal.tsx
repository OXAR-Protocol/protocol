"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { VAULT_CONFIGS } from "@oxar/sdk";

import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { usePortfolio } from "@/hooks/use-portfolio";
import { deriveVaultPda } from "@/lib/pda";
import { getBondColor } from "@/lib/bond-constants";
import type { SwapSource } from "@/lib/swap-source";
import { PaymentRow } from "./payment-row";
import { TokenMark } from "./token-mark";

interface FromSelectModalProps {
  open: boolean;
  source: SwapSource;
  onClose: () => void;
  onSelect: (source: SwapSource) => void;
}

export function FromSelectModal({
  open,
  source,
  onClose,
  onSelect,
}: FromSelectModalProps) {
  const { positions } = usePortfolio();

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

  const holdings = useMemo(() => {
    if (positions.length === 0) return [];
    return VAULT_CONFIGS.map((config) => {
      const [pda] = deriveVaultPda(
        config.region,
        config.denomination,
        config.assetSubtype,
        config.series,
      );
      const position = positions.find(
        (p) => p.vault.publicKey.toBase58() === pda.toBase58(),
      );
      if (!position || position.balance.isZero()) return null;
      return { config, position };
    }).filter((h): h is NonNullable<typeof h> => h !== null);
  }, [positions]);

  if (!open) return null;

  const handleSelectPayment = (id: string) => {
    onSelect({ kind: "fiat", methodId: id });
    onClose();
  };

  const handleSelectHolding = (vaultId: string) => {
    onSelect({ kind: "bond", vaultId });
    onClose();
  };

  const enabledMethods = PAYMENT_METHODS.filter((m) => m.enabled);
  const soonMethods = PAYMENT_METHODS.filter((m) => !m.enabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[480px] max-h-[85vh] rounded-[5px] border border-white/10 bg-surface-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">
            From
          </span>
          <button
            onClick={onClose}
            className="p-1 text-white/30 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {holdings.length > 0 && (
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wide text-white/25">
                  My bonds
                </span>
                <span className="font-mono text-[10px] text-white/20">
                  {holdings.length}{" "}
                  {holdings.length === 1 ? "holding" : "holdings"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {holdings.map(({ config, position }) => {
                  const { color, rgb } = getBondColor(config.denomination);
                  const isSelected =
                    source.kind === "bond" && source.vaultId === config.id;
                  const balanceTokens =
                    position.balance.toNumber() / 1_000_000;
                  return (
                    <button
                      key={config.id}
                      onClick={() => handleSelectHolding(config.id)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-[5px] text-left transition-colors ${
                        isSelected
                          ? "bg-white/[0.05]"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <TokenMark
                        symbol={config.denomination}
                        color={color}
                        rgb={rgb}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-sans text-sm text-white block">
                          ox{config.denomination}
                        </span>
                        <span className="font-mono text-[10px] text-white/30 uppercase block truncate">
                          {balanceTokens.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          available
                        </span>
                      </div>
                      {isSelected && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-white/25">
                Pay with
              </span>
              <span className="font-mono text-[10px] text-white/20">
                {enabledMethods.length}{" "}
                {enabledMethods.length === 1 ? "method" : "methods"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {enabledMethods.map((m) => (
                <PaymentRow
                  key={m.id}
                  method={m}
                  selected={source.kind === "fiat" && m.id === source.methodId}
                  onClick={() => handleSelectPayment(m.id)}
                />
              ))}
            </div>
          </div>

          {soonMethods.length > 0 && (
            <div className="px-5 py-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wide text-white/25">
                  Coming soon
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {soonMethods.map((m) => (
                  <PaymentRow
                    key={m.id}
                    method={m}
                    selected={false}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
