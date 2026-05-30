/**
 * Build an SVG polyline path for a series of values within a `width`×`height` box.
 * Min maps to the bottom, max to the top (SVG y grows downward); a flat series is
 * centered. Returns "" for fewer than 2 points. Coordinates are rounded to 2dp.
 */
export function sparklinePath(values: number[], width: number, height: number): string {
  if (!values || values.length < 2) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const stepX = width / (values.length - 1);

  const round = (n: number) => Number(n.toFixed(2));

  return values
    .map((v, i) => {
      const x = round(i * stepX);
      const y = round(span === 0 ? height / 2 : height - ((v - min) / span) * height);
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");
}
