"use client";

import { Handshake } from "lucide-react";

/** Fixed field — not random — so the pattern is identical on the server and the
 *  client, and identical every time you see it. Tuple: x%, y%, size, rotation. */
const MARKS: readonly [number, number, number, number][] = [
  [8, 12, 34, -14],
  [72, 6, 26, 11],
  [40, 30, 44, -5],
  [88, 42, 30, -20],
  [4, 52, 28, 9],
  [58, 66, 38, -11],
  [22, 80, 30, 16],
  [80, 86, 26, -7],
];

/**
 * A scatter of handshakes behind the thank-you.
 *
 * Texture, not decoration: at 6% it reads as watermarked paper rather than a
 * sticker sheet, the same trick the banknote background plays elsewhere. Drop it
 * as the first child of a `relative` container and put the copy in a sibling.
 */
export function HandshakeBg() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {MARKS.map(([x, y, size, rotate], i) => (
        <Handshake
          key={i}
          size={size}
          strokeWidth={1.25}
          className="absolute text-black/[0.06]"
          style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${rotate}deg)` }}
        />
      ))}
    </span>
  );
}
