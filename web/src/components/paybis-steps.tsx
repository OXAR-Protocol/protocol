"use client";

import Image from "next/image";

import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/en";

export interface PaybisStep {
  title: TranslationKey;
  body: TranslationKey;
  /** File in /public/help/<dir>/ — omitted for steps that need no picture. */
  shot?: string;
}

/**
 * What the user will actually see on Paybis, in order. Screenshots because the
 * Travel Rule questions in the middle look alarming and stop people — showing the
 * screen beforehand is the difference between finishing and closing the tab.
 */
export function PaybisSteps({ dir, steps }: { dir: string; steps: readonly PaybisStep[] }) {
  const { t } = useT();

  return (
    <ol className="mt-4 space-y-4">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink/15 text-[10px] tabular-nums text-ink/50">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-ink">{t(step.title)}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-ink/50">{t(step.body)}</p>
            {step.shot && (
              <Image
                src={`/help/${dir}/${step.shot}.webp`}
                alt=""
                width={900}
                height={600}
                unoptimized
                className="mt-2 w-full rounded-field border border-ink/10"
              />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
