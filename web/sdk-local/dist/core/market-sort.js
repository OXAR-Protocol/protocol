"use strict";
/**
 * Ordering a shelf of things you could buy.
 *
 * The default is deliberately `""` — the catalog's own order. Ranking by size or
 * by anything else is a claim about what's best, so it has to be asked for; a
 * list that arrives pre-sorted by deposits is us answering a question nobody put.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortMarketItems = sortMarketItems;
/**
 * Items in the requested order, without mutating the input.
 *
 * Anything with a zero figure keeps the catalog's order at the BOTTOM rather
 * than being ranked as a zero: a tokenised stock has no deposit figure at all,
 * and sorting it to last-place-by-value would read as "nobody wants this"
 * instead of "this number doesn't apply here".
 */
function sortMarketItems(items, key, facts) {
    if (!key)
        return [...items];
    if (key === "name") {
        return [...items].sort((a, b) => facts(a).name.localeCompare(facts(b).name, "en", { sensitivity: "base" }));
    }
    const value = (item) => (key === "position" ? facts(item).position : facts(item).deposited);
    const ranked = [];
    const blank = [];
    for (const item of items)
        (value(item) > 0 ? ranked : blank).push(item);
    ranked.sort((a, b) => value(b) - value(a));
    return [...ranked, ...blank];
}
