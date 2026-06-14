"use client";

import { useState } from "react";
import { useWaitlist } from "@/hooks/use-waitlist";
import { Reveal } from "./primitives";
import { ScratchSeat } from "./scratch-seat";
import { SeatedFigure } from "./seated-figure";

const GRID = Array.from({ length: 32 }, (_, i) => i + 1);

export function Waitlist() {
  const { status, serial, error, submit } = useWaitlist();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const sealed = status === "sealed";
  const busy = status === "submitting";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busy && !sealed) submit(email.trim(), honeypot);
  };

  return (
    <section id="waitlist" className="relative overflow-hidden bg-black px-[clamp(24px,5.5vw,80px)] py-[clamp(80px,10vw,140px)] text-white">
      {/* "il gioco degli assenti" — faint numbered crowd behind everything. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-4 gap-x-6 gap-y-2 p-[clamp(24px,5.5vw,80px)] opacity-[0.07] sm:grid-cols-8">
        {GRID.map((n) => (
          <div key={n} className="flex items-end justify-center gap-1">
            <span className="text-[10px] tabular-nums">{n}</span>
            <SeatedFigure className="h-[clamp(40px,7vw,80px)] w-auto text-white" />
          </div>
        ))}
      </div>

      <div className="relative grid items-center gap-[clamp(40px,6vw,96px)] lg:grid-cols-[1fr_auto]">
        <div>
          <Reveal>
            <p className="lowercase text-[clamp(18px,1.7vw,24px)] leading-none text-white/55">[ the waitlist ]</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 text-[clamp(32px,4.5vw,64px)] leading-[1.05] tracking-[-0.06em]">
              take a seat. <span className="italic text-white/55">we&apos;ll call</span> your number.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[480px] lowercase text-[clamp(15px,1.4vw,20px)] leading-snug text-white/50">
              drop your email — scratch the seat to claim your spot. group beta first, public launch right after.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <form onSubmit={onSubmit} className="mt-10 max-w-[480px]">
              {/* honeypot — hidden from humans */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
                aria-hidden
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  disabled={sealed}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-12 flex-1 rounded-full border border-white/20 bg-transparent px-5 lowercase text-[16px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/60 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={busy || sealed}
                  className="h-12 shrink-0 rounded-full bg-white px-7 lowercase text-[16px] font-medium text-black transition-colors hover:bg-white/85 disabled:opacity-50"
                >
                  {sealed ? "you're in" : busy ? "claiming…" : "claim my seat"}
                </button>
              </div>
              {error && <p className="mt-3 lowercase text-[14px] text-[#ff6b6b]">{error} — try again</p>}
            </form>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="justify-self-center lg:justify-self-end">
          <ScratchSeat revealed={sealed} serial={serial} />
        </Reveal>
      </div>
    </section>
  );
}
