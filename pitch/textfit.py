"""
Measures text in DM Sans, so the deck can stop guessing.

python-pptx has no idea how tall a paragraph will be, and every attempt to place
one block under another by estimating the one above has failed the same way: a
headline wraps to one more line than expected and lands on its own subtitle.
Estimating average character width does not fix it either, because wrapping breaks
at word boundaries — "where does your money sleep?" is 28 characters, and no
average tells you it becomes three lines rather than two.

So we read the real font. The same woff2 files the site ships are variable, and
fontTools can instantiate them at a weight and hand back glyph advances. From
there the line count is not an estimate at all: it is the same greedy wrap a
renderer does, over the same numbers.
"""

from __future__ import annotations

import functools
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONTS = Path(__file__).resolve().parent.parent / "web" / "src" / "app" / "fonts"
EMU_PER_PT = 12700


@functools.lru_cache(maxsize=8)
def _metrics(italic: bool, weight: int):
    face = "italic" if italic else "normal"
    font = TTFont(FONTS / f"dm-sans-{face}-latin.woff2")
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": weight}, inplace=False, updateFontNames=False)
    hmtx = font["hmtx"]
    cmap = font.getBestCmap()
    upem = font["head"].unitsPerEm
    # Flatten to a plain dict: instantiating is slow and the table lookup is hot.
    adv = {cp: hmtx[g][0] for cp, g in cmap.items() if g in hmtx.metrics}
    return adv, upem, hmtx[cmap[ord("o")]][0]


def width_pt(text: str, size_pt: float, *, bold=False, italic=False) -> float:
    adv, upem, fallback = _metrics(italic, 700 if bold else 400)
    total = sum(adv.get(ord(ch), fallback) for ch in text)
    return total / upem * size_pt


def wrap(text: str, box_pt: float, size_pt: float, *, bold=False, italic=False) -> list[str]:
    """The renderer's own greedy wrap. A word longer than the box gets its own line
    and overflows, which is what every renderer does and what we want to be told
    about rather than silently rescued from."""
    lines: list[str] = []
    current = ""
    for word in text.split():
        trial = f"{current} {word}".strip()
        if not current or width_pt(trial, size_pt, bold=bold, italic=italic) <= box_pt:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def height_emu(text: str, box_emu: int, size_pt: float, *, bold=False, italic=False,
               spacing: float = 1.0) -> int:
    """Rendered height of a paragraph, in EMU. `spacing` is PowerPoint's line-spacing
    multiple; 1.2 is the em-to-line-box factor a renderer applies on top of it."""
    lines = wrap(text, box_emu / EMU_PER_PT, size_pt, bold=bold, italic=italic)
    return int(len(lines) * size_pt * spacing * 1.2 * EMU_PER_PT)
