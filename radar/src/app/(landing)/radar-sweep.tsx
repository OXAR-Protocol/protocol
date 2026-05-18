import {
  idleDelay,
  pingDelay,
  polar,
  RADAR_NODES,
  RADAR_R as R,
  SWEEP_DURATION as D,
} from "./radar-nodes";

const SONAR_PERIOD = 4.2; // seconds
const SONAR_DELAYS = ["0s", "-1.4s", "-2.8s"];
// Pre-positioned transient "blips" at random-ish coordinates.
const BLIPS: readonly { x: number; y: number; delay: string }[] = [
  { x: 78, y: -132, delay: "-1.6s" },
  { x: -148, y: 38, delay: "-3.1s" },
  { x: 132, y: 94, delay: "-0.4s" },
  { x: -64, y: -176, delay: "-4.2s" },
];

export function RadarSweep() {
  return (
    <div className="relative aspect-square w-full max-w-[480px]">
      <svg
        viewBox="-240 -240 480 480"
        className="h-full w-full"
        role="img"
        aria-label="Radar visualizing tracked RWA protocols"
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

        {/* Outer ring + 36 tick marks */}
        <circle r={R + 12} fill="none" stroke="rgba(139,92,246,0.18)" strokeWidth="1" />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = i * 10;
          const major = a % 90 === 0;
          const inner = polar(a, (R + 4) / R);
          const outer = polar(a, (R + (major ? 18 : 10)) / R);
          return (
            <line key={a} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={major ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.15)"}
              strokeWidth={major ? 1.2 : 0.6} />
          );
        })}

        {/* Concentric rings + crosshair */}
        {[0.32, 0.55, 0.78, 1].map((r) => (
          <circle key={r} r={R * r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
        ))}
        <line x1={-R} y1="0" x2={R} y2="0" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        <line x1="0" y1={-R} x2="0" y2={R} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

        {/* Sonar ripples expanding from center */}
        {SONAR_DELAYS.map((delay, i) => (
          <circle key={i} cx="0" cy="0" r="8" fill="none" stroke="var(--color-accent)"
            style={{ animation: `sonar ${SONAR_PERIOD}s ease-out infinite`, animationDelay: delay }} />
        ))}

        {/* Transient blips — atmospheric noise */}
        {BLIPS.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="1.5" fill="rgba(255,255,255,0.55)"
            style={{ animation: "blip-fade 5.2s ease-out infinite", animationDelay: b.delay }} />
        ))}

        {/* Rotating sweep beam */}
        <g style={{ transformOrigin: "0 0", animation: `radar-spin ${D}s linear infinite` }}>
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

        {/* Protocol nodes — group breathes idly, dot pings on sweep */}
        {RADAR_NODES.map((node) => {
          const p = polar(node.angle, node.radius);
          const labelOffsetX = p.x >= 0 ? node.size + 8 : -(node.size + 8);
          const labelAnchor = p.x >= 0 ? "start" : "end";
          return (
            <g
              key={node.slug}
              style={{
                transform: `translate(${p.x}px, ${p.y}px)`,
              }}
            >
              {/* Idle breathing wrapper */}
              <g
                style={{
                  animation: `node-idle 3s ease-in-out infinite`,
                  animationDelay: idleDelay(node.slug),
                  transformOrigin: "0 0",
                }}
              >
                <circle
                  r={node.size}
                  style={{
                    fill: node.highlight ? "var(--color-accent)" : "rgba(255,255,255,0.35)",
                    animation: `radar-ping ${D}s linear infinite`,
                    animationDelay: pingDelay(node.angle),
                  }}
                />
                {node.highlight && (
                  <circle
                    r={node.size + 4}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="0.8"
                    opacity="0.5"
                  />
                )}
              </g>
              {/* Data label appearing when the sweep crosses */}
              <text
                x={labelOffsetX}
                y={3}
                textAnchor={labelAnchor}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fill: node.highlight ? "var(--color-accent)" : "rgba(255,255,255,0.8)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  animation: `node-label ${D}s linear infinite`,
                  animationDelay: pingDelay(node.angle),
                }}
              >
                {node.slug} · {node.tvl}
              </text>
            </g>
          );
        })}

        {/* Center hub with heartbeat */}
        <g style={{ transformOrigin: "0 0" }}>
          <circle
            r="6"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="0.8"
            style={{ animation: "center-pulse 2.4s ease-in-out infinite" }}
          />
          <circle
            r="2.5"
            fill="var(--color-accent)"
            style={{ animation: "center-pulse 2.4s ease-in-out infinite" }}
          />
        </g>
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
