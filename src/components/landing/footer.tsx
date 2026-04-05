const footerLinks = [
  { label: "Docs", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "Telegram", href: "#" },
  { label: "Terms", href: "#" },
];

export function Footer() {
  return (
    <footer
      className="px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4"
      style={{ borderTop: "1px solid #2a2a2a" }}
    >
      <div className="font-display text-[18px] tracking-[0.15em] text-oxar-white">
        OXAR PROTOCOL
      </div>
      <ul className="flex gap-8 list-none flex-wrap justify-center">
        {footerLinks.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="font-mono text-[9px] tracking-[0.12em] text-oxar-light uppercase no-underline transition-colors duration-200 hover:text-oxar-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="font-mono text-[9px] text-oxar-mid tracking-[0.1em] uppercase">
        Built on Solana &middot; 2025
      </div>
    </footer>
  );
}
