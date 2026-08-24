"use client";

import { MetalAvatar } from "@/components/metal-avatar";
import { dmSans } from "@/components/landing-v2/fonts";
import { AxisChart } from "./axis-chart";

/**
 * Three material questions, not four layouts.
 *
 * The layout prototypes were rejected, and rightly — they rearranged the same
 * material. What was actually wrong with the screen is what it is MADE of: the
 * surface of the avatar, the face the numbers are set in, and whether the chart is
 * an instrument or a shape. Each section below shows the current answer next to the
 * proposed one, at the size it is actually seen.
 *
 * Throwaway. Outside APP_ROUTES, no wallet, hardcoded strings, no `t()`.
 */

const SEEDS = [
  "AkC8BHqLXe4Zt9vNfKp2sRj7Ym3cQaWdTb",
  "9xQm2LpVt4Ns7Rk1YbHc6Zd3Ef8Gj5Wa0T",
  "3nRb7Kd9Xw2Qs5Vf8Hm1Tz4Yp6Lc0Ja7Ge",
  "Bq4Tf1Ns8Wd3Rk6Yv9Xc2Zm5Hp7Lj0Ea3Gt",
  "Ld6Xn2Vq9Tb4Km7Rs1Yf5Wc8Hz3Pj0Ga6Ne",
  "Zv8Jm3Qd6Rn1Xk9Tf4Ys7Wb2Hc5Lp0Ea8Gr",
] as const;

export default function ProtoMaterial() {
  return (
    <div data-theme="dark" className={`${dmSans.variable} ${dmSans.className} min-h-screen bg-page text-ink`}>
      <div className="mx-auto max-w-[640px] px-5 pb-24 pt-8">
        <p className="text-[11px] lowercase tracking-[0.18em] text-ink/35">material, not layout</p>
        <h1 className="mt-2 text-[26px] leading-tight tracking-[-0.02em]">three things the screen is made of</h1>

        {/* 1 — the avatar */}
        <Section
          n="1"
          title="the avatar"
          note="today the colour is a hash of your address across four plates — violet, black, amber, green. The most saturated thing on a money screen, chosen by coin flip. Below: the material that is already on your home screen."
        >
          <Row label="today">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#b45309] text-[24px] uppercase text-paper">
              a
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-[15px] uppercase text-paper">
              b
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#065f46] text-[14px] uppercase text-paper">
              c
            </span>
          </Row>

          <Row label="metal · six finishes">
            {SEEDS.map((s) => (
              <MetalAvatar key={s} seed={s} size={56} />
            ))}
          </Row>

          <Row label="at the sizes it is actually used">
            <MetalAvatar seed={SEEDS[0]} size={64} />
            <MetalAvatar seed={SEEDS[0]} size={40} />
            <MetalAvatar seed={SEEDS[0]} size={28} />
            <MetalAvatar seed={SEEDS[0]} size={20} />
          </Row>
        </Section>

        {/* 2 — the numerals */}
        <Section
          n="2"
          title="the numerals"
          note="Geist Mono is already loaded and used in nine places, all of them addresses. Backyard's dashboard reads as an instrument because its figures are monospaced with a slashed zero. Same numbers, two faces:"
        >
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Panel label="today · dm sans">
              <p className="text-[34px] font-light leading-none tracking-[-0.03em] tabular-nums">$3,553.66</p>
              <p className="mt-2 text-[13px] tabular-nums text-loss">−$36.50 · 30 days</p>
              <p className="mt-4 text-[15px] tabular-nums">36.73%</p>
            </Panel>
            <Panel label="mono">
              <p className="font-mono text-[30px] leading-none tracking-[-0.03em] tabular-nums">$3,553.66</p>
              <p className="mt-2 font-mono text-[12px] tabular-nums text-loss">−$36.50 · 30 days</p>
              <p className="mt-4 font-mono text-[14px] tabular-nums">36.73%</p>
            </Panel>
          </div>
        </Section>

        {/* 3 — the chart */}
        <Section
          n="3"
          title="the chart"
          note="ours draws a line with nothing to measure it against, so a red shape reads as worse than it is. Backyard's has a labelled axis and a dotted grid — the same data, made readable."
        >
          <Panel label="with an axis">
            <AxisChart />
          </Panel>
        </Section>

        <p className="mt-14 text-[12px] leading-relaxed text-ink/40">
          Not shipped. Say which of the three to build for real and it goes in against the actual
          components, with strings through <code className="font-mono">t()</code>.
        </p>
      </div>
    </div>
  );
}

function Section({ n, title, note, children }: { n: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-ink/10 pt-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[12px] text-ink/30">{n}</span>
        <h2 className="text-[19px] tracking-[-0.02em]">{title}</h2>
      </div>
      <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-ink/45">{note}</p>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="text-[10px] lowercase tracking-[0.18em] text-ink/30">{label}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-panel border border-ink/10 bg-paper p-4">
      <p className="mb-3 text-[10px] lowercase tracking-[0.18em] text-ink/30">{label}</p>
      {children}
    </div>
  );
}
