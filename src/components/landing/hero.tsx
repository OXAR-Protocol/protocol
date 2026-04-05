import Link from "next/link";

const STATS = [
  { value: "$230B+", label: "Idle stablecoins" },
  { value: "18%", label: "Max APY" },
  { value: "6", label: "Vault types" },
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* Background mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0e17] dark:to-gray-950" />
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/20 blur-[120px]" />
        <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-teal-400/10 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="mb-6 inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-600 dark:text-teal-400">
          Government bonds, on-chain
        </div>

        <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
          Earn 16&ndash;28% APY on real{" "}
          <span className="bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent">
            government bonds
          </span>{" "}
          &mdash; on-chain
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400 sm:text-xl">
          USDC &rarr; yield token. Government-guaranteed. One click.
        </p>

        <Link
          href="/login"
          className="inline-block rounded-xl bg-teal-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:bg-teal-600 hover:shadow-teal-500/40"
        >
          Start Earning
        </Link>
      </div>

      {/* Stats row */}
      <div className="absolute bottom-16 left-0 right-0 mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-8 sm:gap-16">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
