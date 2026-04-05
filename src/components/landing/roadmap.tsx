const MILESTONES = [
  {
    status: "done" as const,
    icon: "\u2705",
    title: "MVP: Ukraine 6 vaults",
    description: "Deposit, claim, marketplace. Privy onboarding. Devnet live.",
    label: "CURRENT",
  },
  {
    status: "next" as const,
    icon: "\u{1F51C}",
    title: "Poland, Turkey expansion",
    description: "Multi-country sovereign bonds. New vault types and currencies.",
    label: "NEXT",
  },
  {
    status: "future" as const,
    icon: "\u{1F4F1}",
    title: "Mobile app",
    description: "Native iOS and Android experience. Push notifications for yield.",
    label: "",
  },
  {
    status: "future" as const,
    icon: "\u{1F3E2}",
    title: "Institutional grade",
    description: "Custody integration, compliance layer, API access for funds.",
    label: "",
  },
];

const BADGES = ["Waitlist open", "Seed round Q3"];

export function Roadmap() {
  return (
    <section id="roadmap" className="bg-gray-50 px-6 py-24 dark:bg-gray-950/50">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-teal-500">
          Roadmap
        </p>
        <h2 className="mb-14 text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Where we are and where we&rsquo;re going
        </h2>

        {/* Timeline */}
        <div className="relative">
          {/* Horizontal line */}
          <div className="absolute left-0 right-0 top-8 hidden h-0.5 bg-gray-200 dark:bg-gray-800 sm:block" />
          <div
            className="absolute left-0 top-8 hidden h-0.5 bg-teal-500 sm:block"
            style={{ width: "25%" }}
          />

          <div className="grid gap-8 sm:grid-cols-4">
            {MILESTONES.map((m) => (
              <div key={m.title} className="relative text-center">
                {/* Dot */}
                <div
                  className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                    m.status === "done"
                      ? "bg-teal-500/20 ring-2 ring-teal-500"
                      : m.status === "next"
                        ? "bg-teal-500/10 ring-2 ring-teal-500/40"
                        : "bg-gray-100 ring-2 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
                  }`}
                >
                  {m.icon}
                </div>
                {m.label && (
                  <span className="mb-2 inline-block rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                    {m.label}
                  </span>
                )}
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                  {m.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {m.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="mt-12 flex justify-center gap-3">
          {BADGES.map((b) => (
            <span
              key={b}
              className="rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-600 dark:text-teal-400"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
