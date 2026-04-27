"use client";

interface MaturityRingProps {
  /** Days remaining until maturity. 0 means matured. */
  daysRemaining: number;
  /** Total term length in days (used to compute % elapsed). */
  termDays: number;
  /** Display APY (e.g. 18). Shown around the ring. */
  apyPct: number;
  /** Bond color (hex). */
  color: string;
  /** Bond color (R,G,B). */
  rgb: string;
}

const SIZE = 260;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MaturityRing({
  daysRemaining,
  termDays,
  apyPct,
  color,
  rgb,
}: MaturityRingProps) {
  const matured = daysRemaining <= 0;
  // Fraction of the term that has already elapsed
  const elapsed = Math.max(0, termDays - daysRemaining);
  const progress = termDays > 0 ? Math.min(1, elapsed / termDays) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const centerLabel = matured
    ? "Matured"
    : daysRemaining >= 365
      ? `${Math.floor(daysRemaining / 365)}y ${daysRemaining % 365}d`
      : daysRemaining >= 1
        ? `${Math.floor(daysRemaining)}d`
        : "<1d";

  // Mark labels (0% / 25% / 50% / 75% / 100%) around the ring
  const marks = [
    { pct: 0, angle: -90 },
    { pct: 25, angle: 0 },
    { pct: 50, angle: 90 },
    { pct: 75, angle: 180 },
  ];

  const labelRadius = RADIUS + 22;

  return (
    <div
      className="relative mx-auto"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-full -rotate-90"
        style={{ filter: `drop-shadow(0 0 24px rgba(${rgb},0.15))` }}
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
        {/* Tip indicator: small dot at the end of the progress arc */}
        {progress > 0 && progress < 1 && (
          <circle
            cx={SIZE / 2 + RADIUS * Math.cos(progress * 2 * Math.PI - Math.PI / 2 + Math.PI / 2)}
            cy={SIZE / 2 + RADIUS * Math.sin(progress * 2 * Math.PI - Math.PI / 2 + Math.PI / 2)}
            r={STROKE / 2 + 2}
            fill={color}
          />
        )}
      </svg>

      {/* Center content (not rotated) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          {matured ? "Status" : "To payout"}
        </span>
        <span
          className="font-mono text-4xl font-light text-white tabular-nums mt-1"
          style={matured ? undefined : { color }}
        >
          {centerLabel}
        </span>
        {!matured && (
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 mt-2">
            {Math.round(progress * 100)}% complete
          </span>
        )}
      </div>

      {/* Outer % marks */}
      {marks.map((m) => {
        const rad = ((m.angle - 90) * Math.PI) / 180;
        const x = SIZE / 2 + labelRadius * Math.cos(rad);
        const y = SIZE / 2 + labelRadius * Math.sin(rad);
        return (
          <span
            key={m.pct}
            className="absolute font-mono text-[9px] tracking-wide text-white/25 -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            {m.pct}%
          </span>
        );
      })}

      {/* APY badge floating top-right */}
      <div
        className="absolute -top-1 -right-1 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-wide"
        style={{
          color,
          background: `rgba(${rgb},0.08)`,
          border: `1px solid rgba(${rgb},0.25)`,
        }}
      >
        {apyPct.toFixed(1)}% APY
      </div>
    </div>
  );
}
