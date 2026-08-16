import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";

import { TERMS_SECTIONS } from "./terms-sections";
import { TERMS_SECTIONS_UK } from "./terms-sections-uk";
import { PLATFORM_FEE_POSSIBLE } from "@/lib/constants";

// The ids are DOM anchors the gate's jump chips scroll to, and the gate swaps
// whole arrays by locale — a section added or removed in only one language
// would silently break the chips for the other. Kept as a test because a
// comment saying "edit both files" enforces nothing.
describe("terms translations stay in step", () => {
  it("same section ids, same order, in every language", () => {
    expect(TERMS_SECTIONS_UK.map((s) => s.id)).toEqual(TERMS_SECTIONS.map((s) => s.id));
  });
});

// The terms are read by people deciding whether to trust us with money, and they
// are the one surface that can't ask whether THIS user is being charged. So the
// only thing that keeps them true is that the prose and the switch are wired to
// the same fact — which is exactly the kind of wiring that gets undone by an
// unrelated edit six months from now.
describe("the fee section says what the build actually does", () => {
  const fees = (list: typeof TERMS_SECTIONS) => {
    const section = list.find((s) => s.id === "fees");
    expect(section, "a terms document with no fee section").toBeDefined();
    return renderToStaticMarkup(section!.body as React.ReactElement);
  };

  for (const [lang, list] of [["en", TERMS_SECTIONS], ["uk", TERMS_SECTIONS_UK]] as const) {
    it(`${lang}: promises nothing it can't keep`, () => {
      const text = fees(list);
      if (PLATFORM_FEE_POSSIBLE) {
        // Charging is possible here, so the rate has to appear — and the reader
        // needs the escape clause that ties it back to the confirm screen.
        expect(text).toMatch(/0\.25/);
        expect(text).toMatch(lang === "en" ? /confirmation screen/ : /підтвердження/);
      } else {
        // Nothing can be collected, so the older, stronger promise stands.
        expect(text).not.toMatch(/0\.25/);
        expect(text).toMatch(lang === "en" ? /no fee of its own/ : /не бере власної комісії/);
      }
    });
  }
});
