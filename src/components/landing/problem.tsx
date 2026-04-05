const CARDS = [
  {
    value: "$230B+",
    label: "Stablecoins earning nothing",
    description: "Sitting idle across DeFi wallets",
    accent: "border-gray-200 dark:border-gray-800",
  },
  {
    value: "4%",
    label: "Ondo / US Treasuries",
    description: "The best you can get today",
    accent: "border-gray-200 dark:border-gray-800",
  },
  {
    value: "16-28%",
    label: "Emerging markets",
    description: "Untapped on-chain",
    accent: "border-teal-500/50",
  },
];

export function Problem() {
  return (
    <section
      id="problem"
      className="bg-gray-50 px-6 py-24 dark:bg-gray-950/50"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal-500">
          The Problem
        </p>
        <h2 className="mb-12 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          $230B+ in stablecoins sitting idle
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.value}
              className={`rounded-2xl border-2 bg-white p-8 text-center transition hover:shadow-lg dark:bg-gray-900 ${card.accent}`}
            >
              <div className="mb-2 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
                {card.value}
              </div>
              <div className="mb-1 text-lg font-semibold text-gray-700 dark:text-gray-300">
                {card.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                {card.description}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-gray-500 dark:text-gray-400">
          Ondo proved demand with $2.5B TVL. But{" "}
          <span className="font-semibold text-teal-500">
            emerging markets are missing.
          </span>
        </p>
      </div>
    </section>
  );
}
