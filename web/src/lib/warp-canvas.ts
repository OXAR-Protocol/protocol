import { LOGO_VIEWBOX, LOGO_PATHS, DRAW_ORDER, GLASS_PATHS, measurePathLength } from "@/components/logo-path-data";

export const WARP_DURATION = 4500;

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export interface WarpPath {
  key: string;
  path2d: Path2D;
  length: number;
  d: string;
}

export interface WarpGlassPath {
  key: string;
  path2d: Path2D;
}

export function buildWarpPaths(): { paths: WarpPath[]; glass: WarpGlassPath[] } {
  const paths: WarpPath[] = DRAW_ORDER.map((key) => {
    const d = LOGO_PATHS[key];
    return {
      key,
      path2d: new Path2D(d),
      length: measurePathLength(d),
      d,
    };
  });
  const glass: WarpGlassPath[] = GLASS_PATHS.map((key) => ({
    key,
    path2d: new Path2D(LOGO_PATHS[key]),
  }));
  return { paths, glass };
}

function strokeGradient(ctx: CanvasRenderingContext2D, alphaA: number, alphaB: number) {
  const gradient = ctx.createLinearGradient(0, 0, LOGO_VIEWBOX.width, 0);
  gradient.addColorStop(0, `rgba(51, 136, 255, ${alphaA})`);
  gradient.addColorStop(1, `rgba(0, 229, 255, ${alphaB})`);
  return gradient;
}

/** Phase 1: DRAW — stroke-dashoffset reveals logo contour sequentially. */
export function drawPhaseDraw(ctx: CanvasRenderingContext2D, progress: number, paths: WarpPath[]) {
  const drawP = progress / 0.27;
  const eased = easeInOutCubic(drawP);

  const pathCount = paths.length;
  const overlapFactor = 0.3;
  const segmentDuration = 1 / (pathCount * (1 - overlapFactor) + overlapFactor);

  for (let i = 0; i < pathCount; i++) {
    const entry = paths[i];
    const segStart = i * segmentDuration * (1 - overlapFactor);
    const segEnd = segStart + segmentDuration;
    const segP = Math.max(0, Math.min(1, (eased - segStart) / (segEnd - segStart)));
    if (segP <= 0) continue;

    const revealLen = entry.length * segP;
    const dashOffset = entry.length - revealLen;

    ctx.save();
    ctx.setLineDash([entry.length]);
    ctx.lineDashOffset = dashOffset;

    ctx.strokeStyle = `rgba(51, 136, 255, ${0.3 * segP})`;
    ctx.lineWidth = 8;
    ctx.filter = "blur(6px)";
    ctx.stroke(entry.path2d);

    ctx.filter = "none";
    ctx.strokeStyle = strokeGradient(ctx, 1, 1);
    ctx.lineWidth = 2;
    ctx.stroke(entry.path2d);

    ctx.restore();
  }
}

/** Phase 2: FILL — gradient wipe fills interior bottom→top. */
export function drawPhaseFill(
  ctx: CanvasRenderingContext2D,
  progress: number,
  paths: WarpPath[],
  glass: WarpGlassPath[],
) {
  const fillP = (progress - 0.27) / 0.17;
  const eased = easeOutCubic(fillP);

  const strokeAlpha = 1 - eased;
  if (strokeAlpha > 0.01) {
    ctx.strokeStyle = strokeGradient(ctx, strokeAlpha, strokeAlpha);
    ctx.lineWidth = 2;
    for (const entry of paths) ctx.stroke(entry.path2d);
  }

  const wipeY = LOGO_VIEWBOX.height * (1 - eased);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, wipeY, LOGO_VIEWBOX.width, LOGO_VIEWBOX.height - wipeY);
  ctx.clip();

  ctx.fillStyle = "#ffffff";
  for (const entry of paths) ctx.fill(entry.path2d);

  for (const g of glass) {
    ctx.fillStyle = "rgba(177, 172, 172, 0.15)";
    ctx.fill(g.path2d);
  }
  ctx.restore();
}

/** Phase 3: BREATH — logo pulses scale 1→1.06→1. */
export function drawPhaseBreath(
  ctx: CanvasRenderingContext2D,
  progress: number,
  paths: WarpPath[],
  glass: WarpGlassPath[],
) {
  const breathP = (progress - 0.44) / 0.27;
  const breathCurve = Math.sin(breathP * Math.PI) * 0.06;
  const scale = 1 + breathCurve;

  ctx.save();
  const lcx = LOGO_VIEWBOX.width / 2;
  const lcy = LOGO_VIEWBOX.height / 2;
  ctx.translate(lcx, lcy);
  ctx.scale(scale, scale);
  ctx.translate(-lcx, -lcy);

  ctx.fillStyle = "#ffffff";
  for (const entry of paths) ctx.fill(entry.path2d);
  for (const g of glass) {
    ctx.fillStyle = "rgba(177, 172, 172, 0.15)";
    ctx.fill(g.path2d);
  }
  ctx.restore();
}

/** Phase 4a: UN-FILL — reverse of FILL. */
export function drawPhaseUnfill(
  ctx: CanvasRenderingContext2D,
  progress: number,
  paths: WarpPath[],
  glass: WarpGlassPath[],
) {
  const unfillP = (progress - 0.71) / 0.14;
  const eased = easeInOutCubic(unfillP);

  const wipeY = LOGO_VIEWBOX.height * eased;
  if (wipeY < LOGO_VIEWBOX.height) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, wipeY, LOGO_VIEWBOX.width, LOGO_VIEWBOX.height - wipeY);
    ctx.clip();

    ctx.fillStyle = "#ffffff";
    for (const entry of paths) ctx.fill(entry.path2d);

    for (const g of glass) {
      ctx.fillStyle = `rgba(177, 172, 172, ${0.15 * (1 - eased)})`;
      ctx.fill(g.path2d);
    }
    ctx.restore();
  }

  const strokeAlpha = eased;
  if (strokeAlpha > 0.01) {
    ctx.strokeStyle = strokeGradient(ctx, strokeAlpha, strokeAlpha);
    ctx.lineWidth = 2;
    for (const entry of paths) ctx.stroke(entry.path2d);
  }
}

/** Phase 4b: UN-DRAW — stroke retracts, glow fades. */
export function drawPhaseUndraw(ctx: CanvasRenderingContext2D, progress: number, paths: WarpPath[]) {
  const undrawP = (progress - 0.85) / 0.11;
  const eased = easeInOutCubic(undrawP);

  const pathCount = paths.length;
  const overlapFactor = 0.3;
  const segmentDuration = 1 / (pathCount * (1 - overlapFactor) + overlapFactor);

  for (let i = 0; i < pathCount; i++) {
    const ri = pathCount - 1 - i;
    const entry = paths[ri];
    const segStart = i * segmentDuration * (1 - overlapFactor);
    const segEnd = segStart + segmentDuration;
    const segP = Math.max(0, Math.min(1, (eased - segStart) / (segEnd - segStart)));

    const revealFraction = 1 - segP;
    if (revealFraction <= 0) continue;

    const revealLen = entry.length * revealFraction;
    const dashOffset = entry.length - revealLen;

    ctx.save();
    ctx.setLineDash([entry.length]);
    ctx.lineDashOffset = dashOffset;

    ctx.strokeStyle = `rgba(51, 136, 255, ${0.3 * revealFraction})`;
    ctx.lineWidth = 8;
    ctx.filter = "blur(6px)";
    ctx.stroke(entry.path2d);

    ctx.filter = "none";
    ctx.strokeStyle = strokeGradient(ctx, 1, 1);
    ctx.lineWidth = 2;
    ctx.stroke(entry.path2d);

    ctx.restore();
  }
}

/** Radial glow underneath the logo (in screen space, outside logo transform). */
export function drawRadialGlow(
  ctx: CanvasRenderingContext2D,
  progress: number,
  cx: number,
  cy: number,
) {
  if (progress < 0.2 || progress >= 0.9) return;
  let glowAlpha: number;
  if (progress < 0.44) {
    glowAlpha = ((progress - 0.2) / 0.24) * 0.3;
  } else if (progress < 0.71) {
    const breathP = (progress - 0.44) / 0.27;
    glowAlpha = 0.3 + Math.sin(breathP * Math.PI) * 0.2;
  } else {
    glowAlpha = 0.3 * (1 - (progress - 0.71) / 0.19);
  }
  glowAlpha = Math.max(0, Math.min(1, glowAlpha));
  if (glowAlpha <= 0.01) return;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
  grad.addColorStop(0, `rgba(51, 136, 255, ${glowAlpha})`);
  grad.addColorStop(0.5, `rgba(0, 229, 255, ${glowAlpha * 0.3})`);
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 200, 0, Math.PI * 2);
  ctx.fill();
}

/** Final fade to background at the very end. */
export function drawPhaseFade(ctx: CanvasRenderingContext2D, progress: number, w: number, h: number) {
  if (progress < 0.96) return;
  const fadeP = (progress - 0.96) / 0.04;
  ctx.fillStyle = `rgba(0, 0, 0, ${fadeP})`;
  ctx.fillRect(0, 0, w, h);
}
