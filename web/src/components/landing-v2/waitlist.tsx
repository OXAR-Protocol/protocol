"use client";

import { useState } from "react";
import { useWaitlist } from "@/hooks/use-waitlist";
import { Reveal } from "./primitives";

export function Waitlist() {
  const { status, error, submit } = useWaitlist();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const sealed = status === "sealed";
  const busy = status === "submitting";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busy && !sealed) submit(email.trim(), honeypot);
  };

  return (
    <section id="waitlist" className="bg-black px-[clamp(24px,5.5vw,80px)] py-[clamp(72px,9vw,120px)] text-white">
      {/* Form — sits above the crowd. */}
      <div className="mx-auto max-w-[760px] text-center">
        <Reveal>
          <p className="lowercase text-[clamp(18px,1.7vw,24px)] leading-none text-white/55">[ the waitlist ]</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-6 text-[clamp(32px,4.5vw,64px)] leading-[1.05] tracking-[-0.06em]">
            take a seat. <span className="italic text-white/55">we&apos;ll call</span> your number.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-[520px] flex-col gap-3 md:flex-row">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden
            />
            <input
              type="email"
              required
              value={email}
              disabled={sealed}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 w-full shrink-0 rounded-full border border-white/20 bg-transparent px-5 lowercase text-[16px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/60 disabled:opacity-40 md:w-auto md:flex-1"
            />
            <button
              type="submit"
              disabled={busy || sealed}
              className="h-12 shrink-0 rounded-full bg-white px-7 lowercase text-[16px] font-medium text-black transition-colors hover:bg-white/85 disabled:opacity-50"
            >
              {sealed ? "you're in" : busy ? "claiming…" : "take my seat"}
            </button>
          </form>
        </Reveal>
        {error && <p className="mt-3 lowercase text-[14px] text-[#ff6b6b]">{error} — try again</p>}
        {sealed && (
          <p className="mt-4 lowercase text-[clamp(13px,1.3vw,16px)] text-white/55">
            you&apos;re on the list — we&apos;ll be in touch.
          </p>
        )}
      </div>

      {/* The crowd. */}
      <div className="mx-auto mt-[clamp(40px,6vw,80px)] w-full max-w-[820px]">
        <img src="/waitlist-crowd.jpg" alt="" className="block w-full select-none" />
      </div>
    </section>
  );
}
