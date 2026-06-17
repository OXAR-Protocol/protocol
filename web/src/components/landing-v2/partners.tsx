"use client";

import { Label, Reveal } from "./primitives";

interface Partner {
  name: string;
  logo: string;
  /** Optional outbound link — omit to render a non-clickable logo. */
  href?: string;
}

// Monochrome black logos on the light theme — shown muted, full black on hover.
const PARTNERS: Partner[] = [
  // Delora: official site URL unconfirmed — left non-linked until verified.
  { name: "Delora", logo: "/partners/delora.svg" },
  { name: "Superteam Ukraine", logo: "/partners/superteam-ua.svg", href: "https://ua.superteam.fun" },
];

export function Partners() {
  return (
    <section
      id="partners"
      className="bg-white px-[clamp(24px,5.5vw,80px)] py-[clamp(80px,10vw,140px)] text-black"
    >
      <Reveal>
        <Label className="md:ml-[51%]">partners</Label>
      </Reveal>
      <Reveal delay={0.05}>
        <div className="mt-6 text-[clamp(32px,4.5vw,64px)] leading-[1.05] tracking-[-0.04em] md:ml-[51%]">
          <p>who we</p>
          <p className="italic">build with.</p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-[clamp(48px,7vw,96px)] flex flex-wrap items-center gap-x-[clamp(40px,6vw,88px)] gap-y-10 md:ml-[51%]">
          {PARTNERS.map((p) => {
            const logo = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.logo}
                alt={p.name}
                className="h-7 md:h-9 w-auto opacity-50 transition hover:opacity-100"
              />
            );
            return p.href ? (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                title={p.name}
              >
                {logo}
              </a>
            ) : (
              <span key={p.name} title={p.name}>
                {logo}
              </span>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
