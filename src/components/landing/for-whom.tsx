"use client";

import { useState } from "react";
import Link from "next/link";

const AUDIENCES = [
  {
    id: "investor",
    tab: "Crypto Investor",
    title: "Higher yield than US Treasuries. Same simplicity.",
    description:
      "Your stablecoins can do more. Access emerging market government bonds with yields 4-5x higher than what Ondo or US Treasuries offer. Same token-based experience you already know.",
    cta: "Explore Vaults",
    features: ["Up to 18% APY", "USDC deposit", "Daily yield accrual", "Sell anytime on marketplace"],
  },
  {
    id: "diaspora",
    tab: "Ukrainian Diaspora",
    title: "Support Ukraine while earning. War Bonds available.",
    description:
      "Buy Ukrainian government bonds from anywhere in the world. War Bonds let you directly support the country while earning competitive yields. No Ukrainian bank account needed.",
    cta: "Buy War Bonds",
    features: ["War Bonds available", "Support Ukraine directly", "No local bank needed", "Tax-free for individuals"],
  },
  {
    id: "institutional",
    tab: "Institutional",
    title: "Emerging market exposure on-chain. Regulated assets.",
    description:
      "Diversify into emerging market sovereign debt without the operational overhead. Regulated broker-dealer, on-chain settlement, and full audit trail.",
    cta: "Contact Us",
    features: ["Regulated broker", "On-chain settlement", "Audit trail", "API access coming"],
  },
];

export function ForWhom() {
  const [active, setActive] = useState(0);
  const audience = AUDIENCES[active];

  return (
    <section id="for-whom" className="bg-gray-50 px-6 py-24 dark:bg-gray-950/50">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-teal-500">
          For Whom
        </p>
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          One product &mdash; three different motivations
        </h2>

        {/* Tab buttons */}
        <div className="mb-8 flex justify-center gap-2">
          {AUDIENCES.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setActive(i)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                active === i
                  ? "bg-teal-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {a.tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900 sm:p-10">
          <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            {audience.title}
          </h3>
          <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-400">
            {audience.description}
          </p>
          <ul className="mb-8 grid grid-cols-2 gap-3">
            {audience.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600"
          >
            {audience.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
