const BADGES = [
  {
    title: "Solana + Anchor",
    description: "Smart contracts built with Anchor framework on Solana for speed and safety.",
  },
  {
    title: "Daily yield accrual",
    description: "Yield tokens appreciate daily based on the underlying bond coupon rate.",
  },
  {
    title: "Privy auth",
    description: "Log in with email or wallet. Embedded Solana wallet created automatically.",
  },
  {
    title: "Secondary marketplace",
    description: "Trade bond tokens peer-to-peer before maturity. Built-in liquidity.",
  },
];

export function TechSection() {
  return (
    <section id="tech" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-teal-500">
          Under the Hood
        </p>
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Under the hood &mdash; Solana. For you &mdash; one button.
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-gray-500 dark:text-gray-400">
          For those who want details. No jargon overload.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {BADGES.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{b.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
