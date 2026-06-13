export const STEPS = [
  {
    number: "01",
    title: "Connect or tap",
    description:
      "Crypto wallet or Apple Pay. No bank account, no broker. Setup takes a minute.",
  },
  {
    number: "02",
    title: "Choose your pace",
    description:
      "Sleepy (5%), Walking (7%), Running (10%+). Three risk templates — pick once, change anytime.",
  },
  {
    number: "03",
    title: "Money wakes up",
    description:
      "Your USDC flows into curated yield sources — Ondo, Maple, Kamino, Ethena. Daily yield, transparent on-chain.",
  },
  {
    number: "04",
    title: "Save together",
    description:
      "Start a pile with friends for a real goal — Lisbon, Bali, a wedding. Yield accelerates the group.",
  },
  {
    number: "05",
    title: "Wake some up anytime",
    description:
      "Withdraw whenever. No locks, no penalty. Your money sleeps because you let it, not because it has to.",
  },
];

export const ARC_RADIUS = 600;
export const ARC_CENTER_Y_RATIO = 0.5;
// The arc behaves like a wheel: scroll rotates it continuously. The step whose
// index equals the current (fractional) progress sits at the active angle;
// neighbours fan out by STEP_ARC_SPAN and fade with distance.
const STEP_ARC_SPAN = 26; // degrees between adjacent steps
const ACTIVE_ANGLE = 0; // 3 o'clock — the active slot

// Mobile: push arc further left so numbers don't overlap text.
export function getArcCenterX(screenWidth: number) {
  if (screenWidth < 640) return -ARC_RADIUS + 70;
  if (screenWidth < 768) return -ARC_RADIUS + 110;
  return -ARC_RADIUS + 190;
}

// Position of a step given the continuous scroll progress (0..totalSteps-1).
export function getArcPosition(
  stepIndex: number,
  progress: number,
  screenHeight: number,
  centerX: number,
) {
  const angleDeg = ACTIVE_ANGLE - (stepIndex - progress) * STEP_ARC_SPAN;
  const angleRad = (angleDeg * Math.PI) / 180;
  const cy = screenHeight * ARC_CENTER_Y_RATIO;

  return {
    x: centerX + ARC_RADIUS * Math.cos(angleRad),
    y: cy - ARC_RADIUS * Math.sin(angleRad),
    angleDeg,
  };
}

// Emphasis by distance from the active slot: near = bright/large, far = gone.
export function getMarkerStyle(distance: number) {
  const d = Math.abs(distance);
  return {
    opacity: Math.max(0, 1 - d * 0.55),
    fontRem: Math.max(0.9, 2.7 - d * 0.8),
    dotScale: Math.max(0.45, 1 - d * 0.32),
  };
}
