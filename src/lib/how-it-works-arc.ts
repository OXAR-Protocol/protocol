export const STEPS = [
  {
    number: "01",
    title: "Deposit USDC",
    description: "Connect with email or wallet. No complex setup required.",
  },
  {
    number: "02",
    title: "Choose Vault",
    description: "Pick country, currency, and bond type. Multiple vaults available.",
  },
  {
    number: "03",
    title: "Get Yield Token",
    description: "Receive oxUAH, oxUSD — yield-bearing SPL tokens on Solana.",
  },
  {
    number: "04",
    title: "Earn Daily",
    description: "Token price increases every day as bond yield accrues on-chain.",
  },
  {
    number: "05",
    title: "Exit Anytime",
    description: "Sell on built-in marketplace or wait for bond maturity.",
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
