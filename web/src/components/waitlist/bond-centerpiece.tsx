"use client";

export function BondCenterpiece() {
  return (
    <div className="text-center max-w-[440px] mx-auto">
      <div className="flex items-center justify-center gap-3">
        <span className="block w-8 h-px bg-white/20" />
        <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-white/35">
          The Bearer is Entitled to
        </span>
        <span className="block w-8 h-px bg-white/20" />
      </div>

      <div className="mt-5 font-sans italic leading-[0.95] text-[clamp(2rem,5.2vw,2.6rem)] text-white">
        Priority Access
      </div>

      <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
        to the OXAR Protocol · Alpha
      </div>

      <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
        First allocation · Founder updates · Direct line to the team
      </div>
    </div>
  );
}
