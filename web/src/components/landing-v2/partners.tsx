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
        <Label className="text-center">partners</Label>
      </Reveal>
      <Reveal delay={0.05}>
        <div className="mt-6 text-center text-[clamp(32px,4.5vw,64px)] leading-[1.05] tracking-[-0.04em]">
          <p>
            who we <span className="italic">build with.</span>
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mx-auto mt-[clamp(56px,8vw,112px)] flex max-w-[820px] flex-wrap items-center justify-center gap-x-[clamp(56px,11vw,160px)] gap-y-12 md:justify-around">
          {PARTNERS.map((p) => {
            const logo = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.logo}
                alt={p.name}
                className="h-9 md:h-12 w-auto opacity-55 transition hover:opacity-100"
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
