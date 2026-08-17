#!/usr/bin/env python3
"""
Builds the app icon: the OXAR mark, flat white, on a violet squircle.

    DYLD_LIBRARY_PATH="$(brew --prefix cairo)/lib" python3 mobile/make_icon.py

Dark, iridescent, with a flat white mark on top.

The material moved to the background. A metal-filled mark and a shimmering
surface underneath it were two things competing for the same glance, and at sixty
points across, the one that wins is whichever is brighter — which made the icon
read differently at different sizes. So the surface shimmers and the mark is
plain white: one shape, unmistakable at any size, on a background that rewards
looking closer.

No hue at all: black and silver. Colour was the mistake in the pass before —
violet and teal read as a gradient, and a gradient is not what chrome does.
Chrome is near-black with a few places where the light lands hard, so the sweep
is mostly dark with two bright bands, and the middle is pulled down further so
the highlights sit in the corners where they decorate rather than compete. The
mark casts a real shadow onto it, which is what stops the whole thing looking
like a sticker.

The mark is rendered from `white.svg`, not traced out of the old PNG. Tracing a
3D render recovers a shape with perspective baked into it; the SVG is the mark
itself.
"""

from __future__ import annotations

import math
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
MARK_SVG = ROOT / "web" / "public" / "images" / "white.svg"
OUT = Path(__file__).resolve().parent / "assets" / "icon.png"

SIZE = 1024
SS = 4  # supersample: the squircle's shoulders alias badly at 1x

# Black and silver, no hue. Colour was the mistake in the last pass — violet, teal
# and indigo read as a gradient, and a gradient is not what chrome does. Chrome is
# near-black with a few places where the light lands hard, which is exactly this
# ramp: dark, a bright band, dark again, a duller band, dark. Barely cool rather
# than neutral, the way real polished steel is.
SILVER = [
    (0.00, (0x0A, 0x0B, 0x0E)),
    (0.16, (0xCE, 0xD4, 0xDE)),
    (0.29, (0x16, 0x18, 0x1E)),
    (0.50, (0x74, 0x7B, 0x8A)),
    (0.63, (0x0C, 0x0D, 0x11)),
    (0.83, (0xE4, 0xE9, 0xF2)),
    (1.00, (0x07, 0x07, 0x0A)),
]
VIGNETTE = 0.72  # how hard the centre is pulled down, so the white mark keeps its edge
BG_DARK = (0x03, 0x03, 0x05)
BG_RES = 640  # the sweep is smooth, so it is built small and scaled up

# The metal ramp, top to bottom. Chrome is not a gradient between two greys; it is
# a bright band, a dark band and a horizon, which is why a two-stop ramp always
# looks like plastic.
CHROME = [
    (0.00, (0xE8, 0xEA, 0xF0)),
    (0.28, (0xFF, 0xFF, 0xFF)),
    (0.46, (0x9A, 0xA0, 0xB2)),
    (0.52, (0x5E, 0x64, 0x78)),
    (0.62, (0xD6, 0xDA, 0xE6)),
    (0.82, (0xFF, 0xFF, 0xFF)),
    (1.00, (0x8E, 0x95, 0xA8)),
]

# Width, not height — the mark is taller than it is wide, so 0.74 across puts it at
# roughly 0.80 down, which is about as large as a glyph goes before the squircle's
# shoulders start cropping it.
MARK_SHARE = 0.74
SHADOW_DROP = 0.022  # how far the mark's shadow falls, as a share of the icon


def squircle(size: int, n: float = 4.6) -> Image.Image:
    """A superellipse mask, |x|^n + |y|^n = 1 — the shape iOS actually uses, and
    visibly rounder in the shoulders than a rounded rectangle."""
    mask = Image.new("L", (size, size), 0)
    px = mask.load()
    r = size / 2
    for y in range(size):
        dy = abs((y + 0.5 - r) / r)
        if dy >= 1:
            continue
        # solve for the x where the boundary sits on this row
        dx = (1 - dy ** n) ** (1 / n)
        x0, x1 = int(r - dx * r), int(r + dx * r)
        for x in range(max(0, x0), min(size, x1)):
            px[x, y] = 255
    return mask


def velvet(size: int) -> Image.Image:
    """Polished dark metal: a diagonal ramp that is mostly black with a couple of
    places where the light lands, then pulled down hard in the middle so the white
    mark keeps its edge against it.

    Built at low resolution and scaled up — the sweep is smooth, so a 640px source
    is indistinguishable from a 4096px one and sixty times quicker."""
    n = BG_RES
    base = Image.new("RGB", (n, n))
    px = base.load()
    for y in range(n):
        for x in range(n):
            u = min(0.999, max(0.0, (x / n * 0.58 + y / n * 0.42) ** 1.18))
            for i in range(len(SILVER) - 1):
                t0, c0 = SILVER[i]
                t1, c1 = SILVER[i + 1]
                if t0 <= u <= t1:
                    k = (u - t0) / (t1 - t0)
                    k = k * k * (3 - 2 * k)  # ease, or the bands show their seams
                    lit = [c0[j] + (c1[j] - c0[j]) * k for j in range(3)]
                    break

            # Down in the middle, up at the edges: the highlights belong in the
            # corners, where they are decoration rather than competition.
            d = math.hypot(x - n / 2, y - n / 2) / (n * 0.62)
            v = 1.0 - VIGNETTE * (1.0 - min(1.0, d) ** 1.6)
            px[x, y] = tuple(int(BG_DARK[j] + (lit[j] - BG_DARK[j]) * v) for j in range(3))

    return base.resize((size, size), Image.BICUBIC).filter(
        ImageFilter.GaussianBlur(size * 0.016)
    )


def chrome_ramp(w: int, h: int) -> Image.Image:
    """The metal, as a vertical ramp with a slight lean. Sampling stops rather than
    interpolating two colours is the whole difference between steel and plastic."""
    ramp = Image.new("RGB", (1, h))
    px = ramp.load()
    for y in range(h):
        t = y / (h - 1)
        for i in range(len(CHROME) - 1):
            t0, c0 = CHROME[i]
            t1, c1 = CHROME[i + 1]
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0)
                px[0, y] = tuple(int(c0[j] + (c1[j] - c0[j]) * k) for j in range(3))
                break
    return ramp.resize((w, h), Image.BILINEAR).rotate(
        -8, resample=Image.BICUBIC, expand=False
    )


def build() -> Image.Image:
    s = SIZE * SS
    icon = velvet(s).convert("RGBA")

    # A wide, soft sheen across the top — a surface catching the light, not a stripe.
    sheen = Image.new("L", (s, s), 0)
    ImageDraw.Draw(sheen).ellipse((-s * 0.40, -s * 0.70, s * 1.40, s * 0.44), fill=34)
    icon = Image.composite(
        Image.new("RGBA", (s, s), (0x9F, 0x8A, 0xD8, 0xFF)), icon,
        sheen.filter(ImageFilter.GaussianBlur(s * 0.055)),
    )

    alpha = _mark_alpha(int(s * MARK_SHARE))
    x = (s - alpha.width) // 2
    y = (s - alpha.height) // 2

    # Shadow first, so the mark sits on the surface instead of on top of it.
    shade = Image.new("L", (s, s), 0)
    shade.paste(alpha, (x, y + int(s * SHADOW_DROP)))
    shade = shade.filter(ImageFilter.GaussianBlur(s * 0.018)).point(lambda v: int(v * 0.62))
    icon = Image.composite(Image.new("RGBA", (s, s), (0, 0, 0, 0xFF)), icon, shade)

    white = Image.new("RGBA", alpha.size, (0xFF, 0xFF, 0xFF, 0xFF))
    white.putalpha(alpha)
    icon.alpha_composite(white, (x, y))

    icon.putalpha(squircle(s))
    return icon.resize((SIZE, SIZE), Image.LANCZOS)


def _mark_alpha(width: int) -> Image.Image:
    """Just the mark's shape. Whatever the SVG is filled with is irrelevant — the
    icon paints its own metal through this hole."""
    from io import BytesIO

    png = cairosvg.svg2png(url=str(MARK_SVG), output_width=width)
    return Image.open(BytesIO(png)).convert("RGBA").getchannel("A")


if __name__ == "__main__":
    icon = build()
    # iOS rejects alpha in the app icon; the squircle is only for the flat preview.
    OUT.parent.mkdir(parents=True, exist_ok=True)
    icon.convert("RGB").save(OUT)
    icon.save(OUT.with_name("icon-rounded.png"))
    print(f"{OUT}  ·  {icon.size[0]}x{icon.size[1]}")
