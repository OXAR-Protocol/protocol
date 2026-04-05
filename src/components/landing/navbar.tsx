import Link from "next/link";

const navLinks = [
  { href: "#problem", label: "Problem" },
  { href: "#how", label: "How it works" },
  { href: "#vaults", label: "Vaults" },
  { href: "#roadmap", label: "Roadmap" },
];

export function LandingNavbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-10 py-5"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="font-display text-[22px] tracking-[0.15em] text-oxar-white">
        OXAR
      </div>
      <ul className="hidden md:flex gap-10 list-none">
        {navLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="font-mono text-[10px] tracking-[0.12em] text-oxar-light uppercase no-underline transition-colors duration-200 hover:text-oxar-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <Link
        href="/login"
        className="font-mono text-[10px] tracking-[0.12em] uppercase px-5 py-2.5 border border-oxar-accent text-oxar-accent bg-transparent cursor-pointer transition-all duration-200 hover:bg-oxar-accent hover:text-oxar-black no-underline"
      >
        Launch App
      </Link>
    </nav>
  );
}
