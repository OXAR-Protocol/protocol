"use client";

import { ArrowUpRight } from "lucide-react";

import { proofLinks } from "@/lib/yield/proof";
import { useT } from "@/lib/i18n";

/**
 * Check it yourself. Every row is a link to a source outside this app — the mint
 * that will actually be bought, who issues it, what backs it, where the rate is
 * read from. No row is shown for a claim we can't point at.
 */
export function AssetProof({ id }: { id: string }) {
  const { t } = useT();
  const links = proofLinks(id);
  if (!links.length) return null;

  return (
    <div className="mt-8 rounded-[12px] border border-black/10 bg-white p-5">
      <p className="lowercase text-[13px] text-black/45">{t("proof.title")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/12 px-3 py-1.5 text-[12px] lowercase tracking-wide text-black/65 transition hover:border-black/35 hover:text-black"
          >
            {t(`proof.${l.key}` as "proof.token")}
            <ArrowUpRight size={12} strokeWidth={1.5} />
          </a>
        ))}
      </div>
    </div>
  );
}
