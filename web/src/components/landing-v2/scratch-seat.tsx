"use client";

import { useEffect, useRef } from "react";
import { formatSerial } from "@/hooks/use-waitlist";

const W = 340;
const H = 420;

/** Draw the seated-person silhouette + "your seat" coating onto the canvas. */
function paintSurface(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#3c05c7";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffffff";
  const cx = W / 2;
  ctx.beginPath();
  ctx.arc(cx, 132, 46, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 78, 268);
  ctx.quadraticCurveTo(cx - 78, 196, cx, 196); // shoulders
  ctx.quadraticCurveTo(cx + 78, 196, cx + 78, 268);
  ctx.lineTo(cx - 78, 268);
  ctx.fill();
  ctx.fillRect(cx - 50, 268, 30, 96); // legs
  ctx.fillRect(cx + 20, 268, 30, 96);

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "600 17px var(--font-dm-sans), sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("your seat", cx, 392);
}

export function ScratchSeat({
  revealed,
  serial,
}: {
  revealed: boolean;
  serial: number | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) paintSurface(ctx);
  }, []);

  useEffect(() => {
    if (!revealed || ranRef.current) return;
    ranRef.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    const coin = coinRef.current;
    if (!ctx) return;

    // Serpentine path the "coin" sweeps to erase the coating.
    const pts: Array<{ x: number; y: number }> = [];
    let dir = 1;
    for (let y = 70; y <= H - 50; y += 38) {
      for (let t = 0; t <= 1; t += 0.05) {
        const x = dir > 0 ? 40 + t * (W - 80) : W - 40 - t * (W - 80);
        pts.push({ x, y });
      }
      dir *= -1;
    }

    ctx.globalCompositeOperation = "destination-out";
    const start = performance.now();
    const DURATION = 1300;

    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      const upto = Math.floor(p * pts.length);
      for (let i = 0; i < upto; i++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 32, 0, Math.PI * 2);
        ctx.fill();
      }
      const head = pts[Math.min(upto, pts.length - 1)];
      if (coin && head) {
        coin.style.left = `${(head.x / W) * 100}%`;
        coin.style.top = `${(head.y / H) * 100}%`;
        coin.style.opacity = p < 1 ? "1" : "0";
      }
      if (p < 1) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H); // wipe any remainder
    };
    requestAnimationFrame(tick);
  }, [revealed]);

  return (
    <div
      className="relative aspect-[340/420] w-[min(78vw,300px)] overflow-hidden rounded-[18px]"
      style={{ containerType: "size" }}
    >
      {/* Reveal layer (behind the coating) — the ticket with the serial. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <span className="lowercase text-[13px] tracking-[0.06em] text-black/40">
          you&apos;re in · seat reserved
        </span>
        <span className="font-bold text-[clamp(28px,8cqw,40px)] leading-none tracking-[-0.03em] text-[#3c05c7]">
          {serial !== null ? formatSerial(serial) : "OXAR-?????"}
        </span>
        <span className="lowercase text-[13px] text-black/45">
          we&apos;ll call your number
        </span>
      </div>

      {/* Scratch coating */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="absolute inset-0 h-full w-full"
      />
      {/* The coin */}
      <div
        ref={coinRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#f4c430] text-[20px] opacity-0 shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
      >
        🪙
      </div>
    </div>
  );
}
