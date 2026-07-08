import Image from "next/image";
import type { ReactNode } from "react";

export type SlideVariant = "right" | "left" | "full" | "center";

interface Props {
  /** Small bracketed eyebrow label above the headline. */
  kicker: string;
  /** Big DM Sans Bold headline (JSX so you can italicise a word). */
  title: ReactNode;
  /** One or two supporting lines under the headline. */
  sub?: ReactNode;
  /** Collage PNG under /public. */
  image?: string;
  imageAlt?: string;
  /** Extra content below the sub (stats, chips…). */
  children?: ReactNode;
  variant?: SlideVariant;
  /** White slide (black text) instead of the default black slide. */
  light?: boolean;
}

// Landing-matched type: DM Sans (set on the page wrapper), lowercase, bracketed
// labels, tight bold headlines, italic accents. Colours flip with `light`.
const kickerCls = (light?: boolean) =>
  `lowercase text-[clamp(12px,1vw,15px)] leading-none tracking-[0.01em] ${light ? "text-black/40" : "text-white/40"}`;
const titleCls = (light?: boolean) =>
  `font-bold lowercase leading-[0.95] tracking-[-0.02em] text-[clamp(34px,6vw,86px)] ${light ? "text-black" : "text-white"}`;
const subCls = (light?: boolean) =>
  `font-light lowercase text-[clamp(15px,1.5vw,20px)] leading-relaxed max-w-xl ${light ? "text-black/55" : "text-white/55"}`;

/** Bracketed lowercase eyebrow, as on the landing (`[ the problem ]`). */
export function Kicker({ children, light }: { children: ReactNode; light?: boolean }) {
  return <p className={kickerCls(light)}>[ {children} ]</p>;
}

/** One full-screen deck slide. `full` = image-dominant with text overlaid low;
 *  `right`/`left` = split; `center` = image behind centered text. */
export function SlideFrame({ kicker, title, sub, image, imageAlt = "", children, variant = "right", light }: Props) {
  const bg = light ? "bg-white" : "bg-black";
  const K = kickerCls(light), T = titleCls(light), S = subCls(light);

  if (variant === "full") {
    return (
      <section className={`relative min-h-screen w-full overflow-hidden ${bg}`}>
        {image && (
          <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="object-contain object-center opacity-95" />
        )}
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${light ? "from-white via-white/70" : "from-black via-black/70"} to-transparent`} />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-16 md:px-16 md:pb-20">
          <p className={K}>[ {kicker} ]</p>
          <h2 className={`${T} mt-4 max-w-4xl`}>{title}</h2>
          {sub && <p className={`${S} mt-5`}>{sub}</p>}
          {children}
        </div>
      </section>
    );
  }

  if (variant === "center") {
    return (
      <section className={`relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 text-center ${bg}`}>
        {image && (
          <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="scale-110 object-contain opacity-45" />
        )}
        <div className="relative z-10 max-w-2xl">
          <p className={K}>[ {kicker} ]</p>
          <h2 className={`${T} mt-5 mx-auto max-w-4xl`}>{title}</h2>
          {sub && <p className={`${S} mx-auto mt-6 text-center`}>{sub}</p>}
          {children}
        </div>
      </section>
    );
  }

  const imgFirst = variant === "left";
  return (
    <section className={`grid min-h-screen w-full grid-cols-1 items-center gap-6 px-6 py-16 md:grid-cols-2 md:gap-10 md:px-16 ${bg}`}>
      <div className={`${imgFirst ? "md:order-2" : ""} max-w-xl`}>
        <p className={K}>[ {kicker} ]</p>
        <h2 className={`${T} mt-4`}>{title}</h2>
        {sub && <p className={`${S} mt-6`}>{sub}</p>}
        {children}
      </div>
      <div className={`${imgFirst ? "md:order-1" : ""} relative h-[42vh] w-full md:h-[74vh]`}>
        {image && <Image src={image} alt={imageAlt} fill sizes="(max-width:768px) 100vw, 50vw" className="object-contain" />}
      </div>
    </section>
  );
}
