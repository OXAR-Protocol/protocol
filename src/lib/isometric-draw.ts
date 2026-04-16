export const ISOMETRIC = {
  tileW: 100,
  tileH: 58,
  cubeHW: 44,
  cubeHH: 25,
  maxLift: 56,
  influenceRadius: 280,
};

export function isoToScreen(col: number, row: number): [number, number] {
  const sx = col * ISOMETRIC.tileW + (row % 2 === 1 ? ISOMETRIC.tileW / 2 : 0);
  const sy = row * ISOMETRIC.tileH;
  return [sx, sy];
}

export function edgeColor(sx: number, width: number, alpha: number, isDark: boolean): string {
  const t = Math.max(0, Math.min(1, sx / width));
  let r: number, g: number, b: number;
  if (isDark) {
    if (t < 0.5) {
      const p = t * 2;
      r = Math.round(180 * (1 - p) + 80 * p);
      g = Math.round(0 * (1 - p) + 120 * p);
      b = 255;
    } else {
      const p = (t - 0.5) * 2;
      r = Math.round(80 * (1 - p) + 0 * p);
      g = Math.round(120 * (1 - p) + 220 * p);
      b = 255;
    }
  } else {
    if (t < 0.5) {
      const p = t * 2;
      r = Math.round(120 * (1 - p) + 60 * p);
      g = Math.round(0 * (1 - p) + 80 * p);
      b = Math.round(200 * (1 - p) + 180 * p);
    } else {
      const p = (t - 0.5) * 2;
      r = Math.round(60 * (1 - p) + 0 * p);
      g = Math.round(80 * (1 - p) + 160 * p);
      b = Math.round(180 * (1 - p) + 200 * p);
    }
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function drawCollapsedDots(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  width: number,
  isDark: boolean,
) {
  const dotR = 1.3;
  const hw = ISOMETRIC.cubeHW * 0.35;
  const hh = ISOMETRIC.cubeHH * 0.35;
  ctx.fillStyle = edgeColor(sx, width, 0.35, isDark);

  ctx.beginPath();
  ctx.arc(sx, sy - hh, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx + hw, sy, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx, sy + hh, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx - hw, sy, dotR, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCube(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  lift: number,
  width: number,
  isDark: boolean,
) {
  const ch = lift;
  const hw = ISOMETRIC.cubeHW;
  const hh = ISOMETRIC.cubeHH;
  const liftFraction = Math.min(lift / ISOMETRIC.maxLift, 1);

  const topFill = isDark ? "rgba(14, 14, 22, 0.95)" : "rgba(220, 220, 215, 0.95)";
  const leftFill = isDark ? "rgba(8, 8, 14, 0.95)" : "rgba(200, 200, 195, 0.95)";
  const rightFill = isDark ? "rgba(11, 11, 18, 0.95)" : "rgba(210, 210, 205, 0.95)";

  const edgeAlpha = 0.3 + liftFraction * 0.5;
  const ec = edgeColor(sx, width, edgeAlpha, isDark);

  const glowAlpha = liftFraction * 0.35;
  const glowW = hw * 2.5;
  const glowH = hh * 1.6;
  const grad = ctx.createRadialGradient(sx, sy + hh + 3, 0, sx, sy + hh + 3, glowW);
  grad.addColorStop(0, edgeColor(sx, width, glowAlpha, isDark));
  grad.addColorStop(0.5, edgeColor(sx, width, glowAlpha * 0.25, isDark));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(sx, sy + hh + 3, glowW, glowH, 0, 0, Math.PI * 2);
  ctx.fill();

  // top face
  ctx.beginPath();
  ctx.moveTo(sx, sy - ch - hh);
  ctx.lineTo(sx + hw, sy - ch);
  ctx.lineTo(sx, sy - ch + hh);
  ctx.lineTo(sx - hw, sy - ch);
  ctx.closePath();
  ctx.fillStyle = topFill;
  ctx.fill();
  ctx.strokeStyle = ec;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // left face
  ctx.beginPath();
  ctx.moveTo(sx - hw, sy - ch);
  ctx.lineTo(sx, sy - ch + hh);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
  ctx.fillStyle = leftFill;
  ctx.fill();
  ctx.strokeStyle = ec;
  ctx.lineWidth = 1;
  ctx.stroke();

  // right face
  ctx.beginPath();
  ctx.moveTo(sx + hw, sy - ch);
  ctx.lineTo(sx, sy - ch + hh);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx + hw, sy);
  ctx.closePath();
  ctx.fillStyle = rightFill;
  ctx.fill();
  ctx.strokeStyle = ec;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (liftFraction > 0.2) {
    ctx.strokeStyle = edgeColor(sx, width, liftFraction * 0.8, isDark);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy - ch - hh);
    ctx.lineTo(sx + hw, sy - ch);
    ctx.lineTo(sx, sy - ch + hh);
    ctx.lineTo(sx - hw, sy - ch);
    ctx.closePath();
    ctx.stroke();
  }
}
