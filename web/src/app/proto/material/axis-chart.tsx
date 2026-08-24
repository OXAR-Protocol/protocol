"use client";

/**
 * The chart with something to measure against.
 *
 * `HoverChart` draws the line and nothing else — no axis, no grid, no zero. On a
 * month that went down, that leaves a red shape with no scale, which reads as worse
 * than the -0.83% it actually is. A labelled axis is the cheapest honesty available
 * on this screen.
 *
 * Sketch quality on purpose: this exists to answer "does an axis help here", not to
 * replace the real chart.
 */

const VALUES = [
  3990, 3988, 3986, 3900, 3898, 3880, 3878, 3876, 3874, 3872, 3870, 3868, 3866,
  3790, 3788, 3786, 3784, 3760, 3758, 3756, 3754, 3700, 3698, 3696, 3694, 3692,
  3690, 3688, 3686, 3554,
];

const W = 560;
const H = 190;
const PAD_L = 62;
const PAD_B = 22;
const PAD_T = 10;

export function AxisChart() {
  const min = Math.min(...VALUES);
  const max = Math.max(...VALUES);
  // Four rules, rounded outward so the labels are readable numbers rather than the
  // raw extremes of the series.
  const step = (max - min) / 3;
  const ticks = [0, 1, 2, 3].map((i) => min + step * i).reverse();

  const x = (i: number) => PAD_L + (i / (VALUES.length - 1)) * (W - PAD_L - 8);
  const y = (v: number) => PAD_T + (1 - (v - min) / (max - min)) * (H - PAD_T - PAD_B);

  const line = VALUES.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(VALUES.length - 1).toFixed(1)},${H - PAD_B} L${PAD_L},${H - PAD_B} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="portfolio value, 30 days">
      <defs>
        <linearGradient id="proto-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--loss)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--loss)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => {
        const ty = y(t);
        return (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - 8}
              y1={ty}
              y2={ty}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            <text
              x={PAD_L - 10}
              y={ty + 3.5}
              textAnchor="end"
              className="font-mono"
              fontSize="9"
              fill="currentColor"
              fillOpacity="0.35"
            >
              ${Math.round(t).toLocaleString("en-US")}
            </text>
          </g>
        );
      })}

      <path d={area} fill="url(#proto-fill)" />
      <path d={line} fill="none" stroke="var(--loss)" strokeWidth="1.6" strokeLinejoin="round" />

      {["aug 1", "aug 10", "aug 20", "aug 30"].map((label, i) => (
        <text
          key={label}
          x={PAD_L + (i / 3) * (W - PAD_L - 8)}
          y={H - 6}
          textAnchor={i === 0 ? "start" : i === 3 ? "end" : "middle"}
          className="font-mono"
          fontSize="9"
          fill="currentColor"
          fillOpacity="0.3"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
