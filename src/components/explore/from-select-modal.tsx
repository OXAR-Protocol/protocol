"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { PaymentRow } from "./payment-row";

interface FromSelectModalProps {
  open: boolean;
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function FromSelectModal({
  open,
  selectedId,
  onClose,
  onSelect,
}: FromSelectModalProps) {
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

  const handleSelect = (id: string) => {
    onSelect(id);
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
            Pay With
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
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-white/25">
                Available now
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
                  selected={m.id === selectedId}
                  onClick={() => handleSelect(m.id)}
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
