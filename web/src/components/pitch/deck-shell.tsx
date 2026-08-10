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
  main > section { height: 900px !important; min-height: 900px !important; break-after: page; }
  main > section:last-child { break-after: auto; }
}
`;

/** The scroll-snap frame both decks share — the long one at /pitch, the short one
 *  at /pitch/short. */
export function DeckShell({ children }: { children: ReactNode }) {
  return (
    <main className={`${dmSans.variable} ${dmSans.className} h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-black text-white scroll-smooth [&>section]:snap-start [&>section]:snap-always`}>
      <style>{printCss}</style>
      {children}
    </main>
  );
}
