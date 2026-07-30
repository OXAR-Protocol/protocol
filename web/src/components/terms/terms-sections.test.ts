import { describe, it, expect } from "vitest";

import { TERMS_SECTIONS } from "./terms-sections";
import { TERMS_SECTIONS_UK } from "./terms-sections-uk";

// The ids are DOM anchors the gate's jump chips scroll to, and the gate swaps
// whole arrays by locale — a section added or removed in only one language
// would silently break the chips for the other. Kept as a test because a
// comment saying "edit both files" enforces nothing.
describe("terms translations stay in step", () => {
  it("same section ids, same order, in every language", () => {
    expect(TERMS_SECTIONS_UK.map((s) => s.id)).toEqual(TERMS_SECTIONS.map((s) => s.id));
  });
});
