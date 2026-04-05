import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { label: "Vaults", href: "/vaults" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Portfolio", href: "/portfolio" },
  ],
  Resources: [
    { label: "Docs", href: "#" },
    { label: "GitHub", href: "https://github.com/oxar-protocol" },
    { label: "Whitepaper", href: "#" },
  ],
  Legal: [
    { label: "Terms", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Disclaimer", href: "#" },
  ],
};

export function CTAFooter() {
  return (
    <>
      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500/10 via-purple-500/5 to-teal-400/10 p-12 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-teal-500/10 blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-purple-500/10 blur-[80px]" />
            </div>
            <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Start earning on government bonds today
              </h2>
              <p className="mx-auto mb-4 max-w-lg text-gray-600 dark:text-gray-400">
                Deposit USDC and access government-backed yields from emerging markets.
              </p>
              <div className="mb-6 inline-block rounded-full bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-600 dark:text-teal-400">
                0% tax on OVDP income for individuals
              </div>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="w-full rounded-xl bg-teal-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-600 sm:w-auto"
                >
                  Connect Wallet &amp; Start
                </Link>
                <Link
                  href="#"
                  className="w-full rounded-xl border border-gray-300 px-8 py-3.5 text-base font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto"
                >
                  Join Waitlist
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-16 dark:border-gray-800">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 text-xl font-bold text-gray-900 dark:text-white">OXAR</div>
              <p className="text-sm leading-relaxed text-gray-500">
                Tokenized government bonds on Solana. Emerging market yields, on-chain.
              </p>
            </div>
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title}>
                <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                  {title}
                </div>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-500 transition hover:text-gray-900 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 dark:border-gray-800 sm:flex-row">
            <p className="text-sm text-gray-500">
              &copy; 2026 OXAR Protocol. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-gray-400 transition hover:text-gray-900 dark:hover:text-white">
                Telegram
              </a>
              <a href="#" className="text-sm text-gray-400 transition hover:text-gray-900 dark:hover:text-white">
                Discord
              </a>
              <a
                href="https://github.com/oxar-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 transition hover:text-gray-900 dark:hover:text-white"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
