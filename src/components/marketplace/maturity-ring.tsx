"use client";

interface MaturityRingProps {
  /** Days remaining until maturity. 0 means matured. */
  daysRemaining: number;
  /** Total term length in days (used to compute % elapsed). */
  termDays: number;
  /** Display APY (e.g. 18). */
  apyPct: number;
  /** Bond color (hex). */
  color: string;
  /** Bond color (R,G,B). */
  rgb: string;
}

const SIZE = 280;
const CENTER = SIZE / 2;

const ARC_RADIUS = 108;
const ARC_STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

const TICK_OUTER = 130;
const TICK_MAJOR_INNER = 118;
const TICK_MINOR_INNER = 124;

const LABEL_RADIUS = 146;

const TICK_COUNT = 60;
const MAJOR_EVERY = 5; // every 30°

const MARKS = [
  { pct: 0, angle: 0 },
  { pct: 25, angle: 90 },
  { pct: 50, angle: 180 },
  { pct: 75, angle: 270 },
];

// Convert polar (0° = top, clockwise) to cartesian
function polar(angleDeg: number, r: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)];
}

export function MaturityRing({
  daysRemaining,
  termDays,
  apyPct,
  color,
  rgb,
}: MaturityRingProps) {
  const matured = daysRemaining <= 0;
  const elapsed = Math.max(0, termDays - daysRemaining);
  const progress = termDays > 0 ? Math.min(1, elapsed / termDays) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const progressAngle = progress * 360;

  const centerLabel = matured
    ? "Matured"
    : daysRemaining >= 365
      ? `${Math.floor(daysRemaining / 365)}y ${daysRemaining % 365}d`
      : daysRemaining >= 1
        ? `${Math.floor(daysRemaining)}d`
        : "<1d";

  return (
    <div
      className="relative mx-auto"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 w-full h-full"
        style={{ filter: `drop-shadow(0 0 32px rgba(${rgb},0.18))` }}
      >
        {/* Outer faint ring (instrument bezel) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={TICK_OUTER + 2}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
        {/* Inner faint ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={ARC_RADIUS - ARC_STROKE - 4}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />

        {/* Tick marks around the dial */}
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const angle = (i / TICK_COUNT) * 360;
          const isMajor = i % MAJOR_EVERY === 0;
          const inner = isMajor ? TICK_MAJOR_INNER : TICK_MINOR_INNER;
          // Highlight ticks already passed by the progress
          const passed = angle <= progressAngle + 0.5;
          const baseStroke = isMajor
            ? "rgba(255,255,255,0.28)"
            : "rgba(255,255,255,0.10)";
          const stroke = passed
            ? `rgba(${rgb},${isMajor ? 0.85 : 0.45})`
            : baseStroke;
          const [x1, y1] = polar(angle, inner);
          const [x2, y2] = polar(angle, TICK_OUTER);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={isMajor ? 1.6 : 1}
              strokeLinecap="round"
            />
          );
        })}

        {/* Progress arc (rotated so 0 = top) */}
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ARC_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={ARC_STROKE}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ARC_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={ARC_STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
          />
        </g>

        {/* Tip indicator at the head of the progress arc */}
        {progress > 0 && progress < 1 && (() => {
          const [tx, ty] = polar(progressAngle, ARC_RADIUS);
          return (
            <>
              <circle
                cx={tx}
                cy={ty}
                r={ARC_STROKE / 2 + 3}
                fill={color}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
              <circle cx={tx} cy={ty} r={1.5} fill="rgba(0,0,0,0.4)" />
            </>
          );
        })()}

        {/* % labels (outside the ticks) */}
        {MARKS.map((m) => {
          const [x, y] = polar(m.angle, LABEL_RADIUS);
          return (
            <text
              key={m.pct}
              x={x}
              y={y}
              fontSize="9"
              fill="rgba(255,255,255,0.35)"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              textAnchor="middle"
              dominantBaseline="middle"
              letterSpacing="0.05em"
            >
              {m.pct}%
            </text>
          );
        })}
      </svg>

      {/* Center stack — sits inside the inner ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
          {matured ? "Status" : "To payout"}
        </span>
        <span
          className="font-mono text-[44px] leading-none font-light text-white tabular-nums mt-1.5"
          style={matured ? undefined : { color }}
        >
          {centerLabel}
        </span>
        <div
          className="mt-3 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.15em]"
          style={{
            color,
            background: `rgba(${rgb},0.08)`,
            border: `1px solid rgba(${rgb},0.25)`,
          }}
        >
          {apyPct.toFixed(1)}% APY
        </div>
        {!matured && (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 mt-2">
            {Math.round(progress * 100)}% complete
          </span>
        )}
      </div>
    </div>
  );
}
