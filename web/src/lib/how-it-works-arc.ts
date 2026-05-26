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
const STEP_ARC_SPAN = 25;
const CENTER_ANGLE = 0;

// Mobile: push arc further left so numbers don't overlap text.
export function getArcCenterX(screenWidth: number) {
  if (screenWidth < 640) return -ARC_RADIUS + 80;
  if (screenWidth < 768) return -ARC_RADIUS + 120;
  return -ARC_RADIUS + 200;
}

export function getArcPosition(
  stepIndex: number,
  activeStep: number,
  screenHeight: number,
  centerX: number,
) {
  const offset = stepIndex - activeStep;
  const angleDeg = CENTER_ANGLE - offset * STEP_ARC_SPAN;
  const angleRad = (angleDeg * Math.PI) / 180;
  const cx = centerX;
  const cy = screenHeight * ARC_CENTER_Y_RATIO;

  return {
    x: cx + ARC_RADIUS * Math.cos(angleRad),
    y: cy - ARC_RADIUS * Math.sin(angleRad),
    angleDeg,
  };
}

export function getStepStyle(offset: number) {
  const absOffset = Math.abs(offset);
  if (absOffset === 0) {
    return { scale: 1, opacity: 1, fontSize: "clamp(3rem, 8vw, 5rem)" };
  }
  if (absOffset === 1) {
    return { scale: 0.6, opacity: 0.25, fontSize: "clamp(2rem, 5vw, 3.5rem)" };
  }
  return { scale: 0.4, opacity: 0.1, fontSize: "clamp(1.5rem, 4vw, 2.5rem)" };
}
