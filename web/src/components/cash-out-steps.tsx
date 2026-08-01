"use client";

import Image from "next/image";

import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/en";

/**
 * What the user will actually see on Paybis, in order. Screenshots because the two
 * compliance questions in the middle look alarming and stop people — showing the
 * screen beforehand is the difference between finishing and closing the tab.
 */
const STEPS: Array<{ title: TranslationKey; body: TranslationKey; shot?: string }> = [
  { title: "cashout.s1.title", body: "cashout.s1.body", shot: "01-form" },
  { title: "cashout.s2.title", body: "cashout.s2.body", shot: "02-originator" },
  { title: "cashout.s3.title", body: "cashout.s3.body", shot: "03-source" },
  { title: "cashout.s4.title", body: "cashout.s4.body" },
  { title: "cashout.s5.title", body: "cashout.s5.body", shot: "04-address" },
  { title: "cashout.s6.title", body: "cashout.s6.body" },
];

export function CashOutSteps() {
  const { t } = useT();

  return (
    <ol className="mt-4 space-y-4">
      {STEPS.map((step, i) => (
        <li key={step.title} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/15 text-[10px] tabular-nums text-black/50">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-black">{t(step.title)}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-black/50">{t(step.body)}</p>
            {step.shot && (
              <Image
                src={`/help/cashout/${step.shot}.webp`}
                alt=""
                width={900}
                height={600}
                unoptimized
                className="mt-2 w-full rounded-[8px] border border-black/10"
              />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
