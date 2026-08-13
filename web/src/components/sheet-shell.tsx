"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * The modal every money sheet shares — label, title, a way out, and a body that
 * scrolls when it has to. One shell so a walkthrough and a list of ways to pay
 * can't drift into two different-looking dialogs.
 */
export function SheetShell({
  label,
  title,
  onClose,
  children,
}: {
  label: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-no-pull
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-full w-full max-w-[440px] overflow-y-auto rounded-[12px] border border-black/15 bg-white p-6 md:p-7"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] lowercase tracking-[0.2em] text-black/40">{label}</p>
            <h2 className="mt-1 text-xl text-black">{title}</h2>
          </div>
          <button onClick={onClose} className="text-black/45 transition hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
