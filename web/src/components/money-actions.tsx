"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MoreHorizontal, Plus } from "lucide-react";

import { FundSheet } from "@/components/fund-sheet";
import { MoneySheet } from "@/components/money-sheet";
import { useT } from "@/lib/i18n";

/**
 * The two buttons money lives behind, wherever money is shown.
 *
 * The plus is the one act a person does over and over — put more in — so it is a
 * button of its own rather than an item three taps deep. The dots hold everything
 * else: where it goes out to, and what it all adds up to.
 *
 * They travel together and carry their own sheets, so any screen that shows a
 * figure can offer the same two doors without wiring state through the page.
 */
export function MoneyActions({ labelled }: { labelled?: boolean }) {
  const { t } = useT();
  const [open, setOpen] = useState<null | "fund" | "money">(null);

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen("fund")}
          aria-label={t("wallet.fund")}
          className={
            labelled
              ? "inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] lowercase tracking-wide text-white transition hover:bg-black/85"
              : "inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-black/85"
          }
        >
          <Plus size={labelled ? 13 : 17} strokeWidth={2} />
          {labelled && t("wallet.fund")}
        </button>

        <button
          type="button"
          onClick={() => setOpen("money")}
          aria-label={t("money.title")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black/55 transition hover:border-black/40 hover:text-black"
        >
          <MoreHorizontal size={17} strokeWidth={1.5} />
        </button>
      </div>

      <AnimatePresence>
        {open === "fund" && <FundSheet onClose={() => setOpen(null)} />}
        {open === "money" && <MoneySheet onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </>
  );
}
