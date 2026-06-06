"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, ArrowUpRight } from "lucide-react";

import { SectionLabel } from "@/components/section-label";

export default function StocksUnavailablePage() {
  return (
    <div className="max-w-[640px] mx-auto pt-8 pb-32 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionLabel>Stocks</SectionLabel>
        <div className="mt-6 p-8 rounded-[8px] border border-white/10">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.04] border border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/50">
            <Globe size={11} strokeWidth={1.5} />
            Region restricted
          </span>
          <h1 className="mt-4 font-sans text-2xl md:text-3xl text-white leading-tight">
            Tokenized stocks aren&apos;t available in your region
          </h1>
          <p className="mt-3 font-mono text-sm text-white/40 leading-relaxed">
            Tokenized US securities are offered under Regulation S and can&apos;t be
            made available to US persons or certain other jurisdictions. Yield on
            dollar deposits is still available to you.
          </p>
          <Link
            href="/yield"
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 transition"
          >
            Explore yield
            <ArrowUpRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
