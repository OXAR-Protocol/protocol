"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";

/**
 * The surface every money screen sits on.
 *
 * It rises from the bottom edge rather than appearing in the middle. On a phone
 * that is where a thumb is and where the eye expects a sheet to come from — a box
 * dropped into the centre of a page reads like a browser dialog, which is exactly
 * what money screens should not read like. On a wider screen it settles into a
 * centred card, because a sheet pinned to the bottom of a desktop window is a
 * phone habit worn in the wrong place.
 *
 * Drag it down to dismiss, or tap outside. The grab handle says so without a word.
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
  // Dragging starts at the handle and nowhere else. With the whole surface listening,
  // every downward swipe was read as "put it away", so a list longer than the sheet
  // could not be scrolled at all — the finger moved the sheet instead of the list.
  const drag = useDragControls();

  // A sheet over a scrolling page lets the page scroll under it — the sheet moves,
  // the background moves, and neither feels attached to the finger.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-no-pull
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-[2px] sm:items-center sm:bg-white/70 sm:backdrop-blur-sm sm:px-4 sm:py-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        drag="y"
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => {
          // Far enough, or fast enough — either counts as "put it away".
          if (info.offset.y > 120 || info.velocity.y > 600) onClose();
        }}
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom relative max-h-[88vh] w-full overflow-y-auto rounded-t-[22px] border border-black/10 bg-white px-6 pb-6 pt-3 sm:max-h-full sm:max-w-[440px] sm:rounded-[16px] sm:px-7 sm:pb-7 sm:pt-6"
      >
        {/* The handle is the instruction: a bar you can grab, and the only place the
            sheet listens for a drag. `touch-none` keeps the browser from claiming the
            gesture as a scroll before framer sees it. */}
        <div
          onPointerDown={(e) => drag.start(e)}
          className="mx-auto -mt-1 mb-3 flex h-6 w-16 cursor-grab touch-none items-center justify-center active:cursor-grabbing sm:hidden"
        >
          <div className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] lowercase tracking-[0.2em] text-black/40">{label}</p>
            <h2 className="mt-1 text-xl text-black">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            className="-mr-1 -mt-1 p-1 text-black/45 transition hover:text-black"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
