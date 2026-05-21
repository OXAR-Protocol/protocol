"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { NAV_GROUPS } from "./nav-data";

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <SearchTrigger onOpen={() => setOpen(true)} />

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[6px] border border-white/15 bg-surface-1 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="Search OXAR Radar docs" className="text-white">
              <div className="border-b border-white/10 px-4">
                <Command.Input
                  autoFocus
                  placeholder="Search docs…"
                  className="w-full bg-transparent py-4 font-sans text-[15px] text-white outline-none placeholder:text-white/30"
                />
              </div>
              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center font-mono text-[12px] uppercase tracking-[0.15em] text-white/40">
                  No matches
                </Command.Empty>
                {NAV_GROUPS.map((group) => (
                  <Command.Group
                    key={group.title}
                    heading={
                      <span className="px-2 pt-2 pb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                        {group.title}
                      </span>
                    }
                  >
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.href}
                        value={`${group.title} ${item.label}`}
                        onSelect={() => go(item.href)}
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-[14px] text-white/65 transition data-[selected=true]:bg-white/5 data-[selected=true]:text-white"
                      >
                        <span>{item.label}</span>
                        <span className="font-mono text-[10px] text-white/30">{item.href}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
              <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                <span>↑ ↓ navigate · ⏎ select</span>
                <span>esc to close</span>
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-surface-1 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white/55 transition hover:border-white/25 hover:text-white"
    >
      <span>Search docs</span>
      <kbd className="rounded border border-white/10 bg-surface-0 px-1.5 py-0.5 text-[10px] text-white/70">
        ⌘K
      </kbd>
    </button>
  );
}
