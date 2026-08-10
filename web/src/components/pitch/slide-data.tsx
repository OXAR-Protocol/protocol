import Image from "next/image";
import type { ReactNode } from "react";

import { kickerCls, subCls } from "@/components/pitch/slide-frame";

/** The slides that carry facts rather than a picture: columns, rows, steps, figures.
 *  All four share one shell so the deck reads as one type system — a slightly smaller
 *  headline than the photo slides, since these have a body to make room for. */

interface ShellProps {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  /** Small line under the body — the caveat, the source, the "so what". */
  footer?: ReactNode;
  /** Faint collage behind the type. */
  image?: string;
  imageAlt?: string;
  light?: boolean;
  /** Slide body — supplied by the four wrappers below, not by the deck. */
  children: ReactNode;
}

type SlideProps = Omit<ShellProps, "children">;

const dataTitleCls = (light?: boolean) =>
  `font-bold lowercase leading-[0.95] tracking-[-0.02em] text-[clamp(30px,5vw,64px)] ${light ? "text-black" : "text-white"}`;
const labelCls = (light?: boolean) =>
  `text-[13px] lowercase tracking-[0.01em] ${light ? "text-black/45" : "text-white/45"}`;
const bodyCls = (light?: boolean) =>
  `font-light lowercase leading-relaxed text-[clamp(14px,1.3vw,17px)] ${light ? "text-black/70" : "text-white/65"}`;
const ruleCls = (light?: boolean) => (light ? "border-black/10" : "border-white/10");

function Shell({ kicker, title, sub, footer, image, imageAlt = "", light, children }: ShellProps) {
  return (
    <section
      className={`relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-6 py-16 md:px-16 ${light ? "bg-white" : "bg-black"}`}
    >
      {/* The collage sits behind dense type here, so it runs far fainter than on the
          photo slides — and fainter still on white, where the cut-outs are high-contrast. */}
      {image && (
        <Image
          src={image} alt={imageAlt} fill sizes="100vw"
          className={`object-contain ${light ? "opacity-[0.07]" : "opacity-20"}`}
        />
      )}
      <div className="relative z-10 w-full">
        <p className={kickerCls(light)}>[ {kicker} ]</p>
        <h2 className={`${dataTitleCls(light)} mt-4 max-w-3xl`}>{title}</h2>
        {sub && <p className={`${subCls(light)} mt-6`}>{sub}</p>}
        {children}
        {footer && (
          <p className={`mt-12 max-w-2xl text-sm lowercase ${light ? "text-black/40" : "text-white/40"}`}>{footer}</p>
        )}
      </div>
    </section>
  );
}

export interface Column {
  label: string;
  body: string;
}

/** Side-by-side facts — "today's options", "the product". */
export function ColumnsSlide({ columns, ...shell }: SlideProps & { columns: Column[] }) {
  return (
    <Shell {...shell}>
      <div className={`mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 ${columns.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {columns.map((c) => (
          <div key={c.label} className={`border-t pt-5 ${ruleCls(shell.light)}`}>
            <p className={labelCls(shell.light)}>{c.label}</p>
            <p className={`${bodyCls(shell.light)} mt-3`}>{c.body}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export interface Row {
  label: string;
  body: string;
  /** Renders the row in full contrast — used for the OXAR line on competition. */
  highlight?: boolean;
}

/** Stacked label/body rows — competition, roadmap, the fee math. */
export function RowsSlide({ rows, ...shell }: SlideProps & { rows: Row[] }) {
  const { light } = shell;
  return (
    <Shell {...shell}>
      <div className="mt-10">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`grid grid-cols-1 gap-2 border-t py-5 md:grid-cols-[minmax(0,10rem)_1fr] md:gap-8 ${ruleCls(light)}`}
          >
            <p
              className={`text-[15px] lowercase ${r.highlight ? (light ? "font-bold text-black" : "font-bold text-white") : labelCls(light)}`}
            >
              {r.label}
            </p>
            <p className={`${bodyCls(light)} ${r.highlight ? (light ? "text-black" : "text-white") : ""}`}>{r.body}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Numbered steps — the money path. */
export function StepsSlide({ steps, ...shell }: SlideProps & { steps: string[] }) {
  return (
    <Shell {...shell}>
      <div className="mt-12 grid gap-10 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s} className={`border-t pt-5 ${ruleCls(shell.light)}`}>
            <p className={`font-bold leading-none text-[clamp(28px,3vw,40px)] ${shell.light ? "text-black" : "text-white"}`}>
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className={`${bodyCls(shell.light)} mt-4`}>{s}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export interface Stat {
  figure: string;
  label: string;
  note?: string;
}

/** Big figures — traction, market sizing. */
export function StatsSlide({ stats, ...shell }: SlideProps & { stats: Stat[] }) {
  return (
    <Shell {...shell}>
      <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className={`font-bold leading-none text-[clamp(36px,5.5vw,72px)] ${shell.light ? "text-black" : "text-white"}`}>
              {s.figure}
            </p>
            <p className={`mt-3 text-sm lowercase ${shell.light ? "text-black/50" : "text-white/50"}`}>{s.label}</p>
            {s.note && (
              <p className={`mt-2 text-[13px] lowercase ${shell.light ? "text-black/35" : "text-white/35"}`}>{s.note}</p>
            )}
          </div>
        ))}
      </div>
    </Shell>
  );
}
