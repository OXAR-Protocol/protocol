import type { ReactNode } from "react";

import { dmSans } from "@/components/landing-v2/fonts";

/** Print = export to PDF. The scroll container becomes a plain flow, each slide takes
 *  exactly one 16:9 page, and backgrounds are kept (browsers drop them by default —
 *  a black deck would print as white). Chrome: `--print-to-pdf --no-pdf-header-footer`. */
const printCss = `
@media print {
  @page { size: 1600px 900px; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  main { height: auto !important; overflow: visible !important; }
  main > section {
    height: 900px !important; min-height: 900px !important;
    overflow: hidden !important; break-after: page;
    content-visibility: visible !important;
  }
  main > section:last-child { break-after: auto; }

  /* Chrome does not honour Tailwind's \`md:\` breakpoints when printing, so every
     rule that produced the desktop layout silently vanishes: split slides collapse
     to one column with the picture dumped underneath, viewport-height boxes shrink,
     and \`hidden md:block\` bands disappear entirely. The PDF is the artefact people
     actually get sent, so the desktop layout is restored here by hand. */
  [data-split] {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    align-items: center !important;
    gap: 40px !important;
    padding-left: 64px !important;
    padding-right: 64px !important;
  }
  [data-split-text="second"] { order: 2 !important; }
  [data-split-img="first"] { order: 1 !important; }
  [data-split-img] { height: 660px !important; }
  [data-band] { display: block !important; }
}
`;

/** The scroll-snap frame both decks share — the long one at /pitch, the short one
 *  at /pitch/short. */
export function DeckShell({ children }: { children: ReactNode }) {
  return (
    <main
      className={`${dmSans.variable} ${dmSans.className} h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-black text-white scroll-smooth [&>section]:snap-start [&>section]:snap-always [&>section]:[content-visibility:auto] [&>section]:[contain-intrinsic-size:100vw_100vh]`}
    >
      <style>{printCss}</style>
      {children}
    </main>
  );
}
