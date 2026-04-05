const CARDS = [
  {
    emoji: "\u{1F3DB}\uFE0F",
    title: "Bonds via licensed broker",
    description: "Regulated by NSSMC. Real government securities purchased through compliant channels.",
  },
  {
    emoji: "\u{1F50D}",
    title: "Smart contract audited",
    description: "Open source code. Every line is verifiable on GitHub before you deposit a cent.",
  },
  {
    emoji: "\u{1F4CA}",
    title: "Proof of Reserve on-chain",
    description: "Verify the backing anytime. Transparent reserves published on Solana.",
  },
  {
    emoji: "\u26A1",
    title: "Solana top-3 blockchain",
    description: "Fast, cheap, reliable. Sub-second finality and near-zero transaction fees.",
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-teal-500">
          Why Trust Us
        </p>
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Real bonds. Real government. On-chain transparency.
        </h2>
        <p className="mx-auto mb-14 max-w-2xl text-center text-gray-500 dark:text-gray-400">
          The main objection: &ldquo;Is this a scam?&rdquo; Let&rsquo;s close it with facts.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 text-3xl">{card.emoji}</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {card.title}
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
