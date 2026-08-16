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
  /** Run `image` full-bleed under a scrim instead of faint behind the type — for
   *  photographs that fill the frame rather than cut-outs that float in it. */
  cover?: boolean;
  /** Scrim strength over a `cover` image, 0–100. Higher = quieter picture. Busy
   *  photographs under dense text need more; a single figure needs less. */
  scrim?: number;
  /** Shield only the side the type sits on, and let the rest of the photograph keep
   *  its colour. Without this the scrim is flat and the whole image goes pale. */
  scrimFrom?: "left" | "bottom";
  /** CSS object-position for the image. Note this does nothing horizontally when a
   *  portrait source fills a landscape frame — the width is already exact, only the
   *  vertical crop is free. Use `imageBox` to move the subject sideways. */
  imagePos?: string;
  /** Give the photograph its own band of the slide instead of running it behind
   *  everything: full colour, no scrim, and the type keeps clean ground beside it. */
  imageBox?: "right";
  /** Width the slide body is held to, so it never runs under `imageBox`. */
  bodyMax?: string;
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

/** Flat wash, or a gradient that only covers the side carrying type. The far end
 *  keeps a small amount so a bright patch can't blow out a stray line of text. */
function scrimBg(strength: number, from: ShellProps["scrimFrom"], light?: boolean): string {
  const rgb = light ? "255,255,255" : "0,0,0";
  const near = strength / 100;
  const far = Math.max(0, near - 0.6);
  if (from === "left") return `linear-gradient(to right, rgba(${rgb},${near}) 0%, rgba(${rgb},${near}) 34%, rgba(${rgb},${far}) 78%)`;
  if (from === "bottom") return `linear-gradient(to top, rgba(${rgb},${near}) 0%, rgba(${rgb},${near}) 40%, rgba(${rgb},${far}) 85%)`;
  return `rgba(${rgb},${near})`;
}

function Shell({ kicker, title, sub, footer, image, imageAlt = "", cover, scrim = 85, scrimFrom, imagePos, imageBox, bodyMax, light, children }: ShellProps) {
  return (
    <section
      className={`relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-6 py-16 md:px-16 ${light ? "bg-white" : "bg-black"}`}
    >
      {/* Matches the photo slides' weight on black (0.45); on white the cut-outs are
          high-contrast and would fight the type, so they run much fainter. */}
      {image && imageBox === "right" ? (
        <div data-band className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] md:block">
          <Image
            src={image} alt={imageAlt} fill loading="eager" sizes="44vw"
            className="object-cover"
            style={imagePos ? { objectPosition: imagePos } : undefined}
          />
          {/* Softens where a photograph starts. Art on true black has no edge to hide,
              but the gradient costs nothing there either. */}
          <div
            className="absolute inset-y-0 left-0 w-[22%]"
            style={{ background: `linear-gradient(to right, ${light ? "#fff" : "#000"}, transparent)` }}
          />
        </div>
      ) : image ? (
        <Image
          src={image} alt={imageAlt} fill loading="eager" sizes="100vw"
          className={cover ? "object-cover" : `object-contain ${light ? "opacity-[0.16]" : "opacity-45"}`}
          style={imagePos ? { objectPosition: imagePos } : undefined}
        />
      ) : null}
      {/* Deep enough that the 13px labels survive the pale patches of the photograph.
          With `scrimFrom` it falls away across the frame, so the picture keeps its
          colour on the side nothing is written. */}
      {cover && (
        <div
          className="absolute inset-0"
          style={{ background: scrimBg(scrim, scrimFrom, light) }}
        />
      )}
      <div className="relative z-10 w-full" style={bodyMax ? { maxWidth: bodyMax } : undefined}>
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
  // The figures are sized in vw, which knows the window and not the column they have
  // to fit in. Hold the body narrow (`bodyMax`) against a four-across grid and they
  // collide — "$295B$15B" — so the track count follows the number of stats, and the
  // type steps down when the body is constrained.
  const narrow = !!shell.bodyMax;
  return (
    <Shell {...shell}>
      <div
        className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12"
        style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` }}
      >
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <p className={`font-bold leading-none ${narrow ? "text-[clamp(28px,3.2vw,50px)]" : "text-[clamp(36px,5.5vw,72px)]"} ${shell.light ? "text-black" : "text-white"}`}>
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
