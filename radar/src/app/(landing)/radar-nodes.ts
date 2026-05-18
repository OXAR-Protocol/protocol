export interface RadarNode {
  slug: string;
  label: string;
  tvl: string;
  /** Compass angle in degrees: 0 = top, 90 = right, increases clockwise. */
  angle: number;
  /** Radius 0..1 from center. */
  radius: number;
  size: number;
  highlight?: boolean;
}

export const RADAR_R = 200;
export const SWEEP_DURATION = 7;

export const RADAR_NODES: readonly RadarNode[] = [
  { slug: "BUIDL", label: "BlackRock", tvl: "$2.1B", angle: 30, radius: 0.85, size: 5.5 },
  { slug: "MAPLE", label: "Maple", tvl: "$10.6M", angle: 85, radius: 0.55, size: 3.5 },
  { slug: "BACKED", label: "Backed", tvl: "$245K", angle: 140, radius: 0.7, size: 3 },
  { slug: "USDY", label: "Ondo USDY", tvl: "$720M", angle: 215, radius: 0.45, size: 4.5 },
  { slug: "CFG", label: "Centrifuge", tvl: "scan", angle: 270, radius: 0.78, size: 3.5 },
  { slug: "OXAR", label: "OXAR", tvl: "devnet", angle: 330, radius: 0.32, size: 4, highlight: true },
];

export function polar(angleDeg: number, r01: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(rad) * RADAR_R * r01, y: -Math.cos(rad) * RADAR_R * r01 };
}

export function pingDelay(angleDeg: number): string {
  return `${(SWEEP_DURATION * (angleDeg / 360 - 1)).toFixed(3)}s`;
}

/** Random-looking but deterministic phase offset for idle breathing per slug. */
export function idleDelay(slug: string): string {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${-((h % 1000) / 1000) * 3}s`;
}
