const LOGOS = [
  "Partner 1",
  "Partner 2",
  "Partner 3",
  "Partner 4",
  "Media 1",
  "Media 2",
];

export function SocialProof() {
  return (
    <section id="social-proof" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-teal-500">
          Social Proof
        </p>
        <h2 className="mb-14 text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Who supports us
        </h2>

        {/* Logo grid */}
        <div className="mb-12 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {LOGOS.map((name) => (
            <div
              key={name}
              className="flex h-20 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-400 dark:border-gray-800 dark:bg-gray-900"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-4 text-lg italic leading-relaxed text-gray-700 dark:text-gray-300">
            &ldquo;Finally, a way to access Ukrainian government bond yields
            without a local brokerage account. The on-chain transparency is
            exactly what DeFi users expect.&rdquo;
          </p>
          <div className="text-sm font-medium text-gray-500">
            &mdash; Early beta user
          </div>
        </div>

        {/* Auditor badge */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Smart contract audit: pending
          </div>
        </div>
      </div>
    </section>
  );
}
