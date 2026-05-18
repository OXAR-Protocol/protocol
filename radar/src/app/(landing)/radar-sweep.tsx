interface Node {
  slug: string;
  label: string;
  /** Compass angle in degrees: 0 = top, 90 = right, increases clockwise. */
  angle: number;
  /** Radius 0..1. */
  radius: number;
  size: number;
  highlight?: boolean;
}

const R = 200;
const DURATION = 7;

const NODES: readonly Node[] = [
  { slug: "buidl", label: "BlackRock BUIDL", angle: 30, radius: 0.85, size: 5.5 },
  { slug: "maple", label: "Maple Finance", angle: 85, radius: 0.55, size: 3.5 },
  { slug: "backed", label: "Backed bIB01", angle: 140, radius: 0.7, size: 3 },
  { slug: "ondo-usdy", label: "Ondo USDY", angle: 215, radius: 0.45, size: 4.5 },
  { slug: "centrifuge", label: "Centrifuge", angle: 270, radius: 0.78, size: 3.5 },
  { slug: "oxar", label: "OXAR", angle: 330, radius: 0.32, size: 4, highlight: true },
];

function polar(angleDeg: number, r01: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(rad) * R * r01, y: -Math.cos(rad) * R * r01 };
}

function pingDelay(angleDeg: number): string {
  return `${(DURATION * (angleDeg / 360 - 1)).toFixed(3)}s`;
}

export function RadarSweep() {
  return (
    <div className="relative aspect-square w-full max-w-[480px]">
      <svg
        viewBox="-240 -240 480 480"
        className="h-full w-full"
        role="img"
        aria-label="Radar sweep visualizing tracked RWA protocols"
      >
        <defs>
          <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring + tick marks */}
        <circle r={R + 12} fill="none" stroke="rgba(139,92,246,0.18)" strokeWidth="1" />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = i * 10;
          const major = a % 90 === 0;
          const inner = polar(a, (R + 4) / R);
          const outer = polar(a, (R + (major ? 18 : 10)) / R);
          return (
            <line
              key={a}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={major ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.15)"}
              strokeWidth={major ? 1.2 : 0.6}
            />
          );
        })}

        {/* Concentric rings */}
        {[0.32, 0.55, 0.78, 1].map((r) => (
          <circle
            key={r}
            r={R * r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.8"
          />
        ))}

        {/* Crosshair */}
        <line x1={-R} y1="0" x2={R} y2="0" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        <line x1="0" y1={-R} x2="0" y2={R} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

        {/* Rotating sweep beam */}
        <g style={{ transformOrigin: "0 0", animation: `radar-spin ${DURATION}s linear infinite` }}>
          <path
            d={`M 0,0 L 0,${-R} A ${R} ${R} 0 0 0 ${(-R * Math.sin(Math.PI / 3)).toFixed(2)},${(-R * Math.cos(Math.PI / 3)).toFixed(2)} Z`}
            fill="rgba(139,92,246,0.14)"
          />
          <path
            d={`M 0,0 L 0,${-R} A ${R} ${R} 0 0 0 ${(-R * Math.sin(Math.PI / 6)).toFixed(2)},${(-R * Math.cos(Math.PI / 6)).toFixed(2)} Z`}
            fill="rgba(139,92,246,0.22)"
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={-R}
            stroke="rgba(139,92,246,0.95)"
            strokeWidth="1.4"
            filter="url(#radarGlow)"
          />
        </g>

        {/* Protocol nodes */}
        {NODES.map((node) => {
          const p = polar(node.angle, node.radius);
          return (
            <g key={node.slug}>
              <circle
                cx={p.x}
                cy={p.y}
                r={node.size}
                style={{
                  fill: node.highlight
                    ? "var(--color-accent)"
                    : "rgba(255,255,255,0.35)",
                  animation: `radar-ping ${DURATION}s linear infinite`,
                  animationDelay: pingDelay(node.angle),
                }}
              />
              {node.highlight && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={node.size + 4}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
              )}
            </g>
          );
        })}

        {/* Center hub */}
        <circle r="2.5" fill="var(--color-accent)" />
        <circle r="6" fill="none" stroke="var(--color-accent)" strokeWidth="0.8" opacity="0.4" />
      </svg>

      <div className="pointer-events-none absolute inset-0 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        <span className="absolute left-2 top-2">SCAN · 360°</span>
        <span className="absolute right-2 top-2 text-accent">● LIVE</span>
        <span className="absolute bottom-2 left-2">UPDATED 5m</span>
        <span className="absolute bottom-2 right-2">6 NODES</span>
      </div>
    </div>
  );
}
