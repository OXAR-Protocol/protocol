import type { ReactNode } from "react";

import { TOP_TABS } from "./nav-data";
import { DocsToc, type TocItem } from "./toc";

interface DocPageProps {
  eyebrow?: string;
  title: string;
  description?: string;
  toc?: readonly TocItem[];
  children: ReactNode;
}

export function DocPage({ eyebrow, title, description, toc, children }: DocPageProps) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-14">
      <article className="max-w-3xl">
        {eyebrow && (
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-3 text-[clamp(2rem,4vw,2.75rem)] font-sans font-normal leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55 [&_a]:text-white [&_a]:underline-offset-2 [&_a]:hover:underline [&_code]:font-mono [&_code]:text-white">
            {description}
          </p>
        )}
        <div className="prose-radar mt-10 space-y-7">{children}</div>
      </article>
      {toc && toc.length > 0 && (
        <aside className="hidden lg:block">
          <DocsToc items={toc} />
        </aside>
      )}
    </div>
  );
}

export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-sans font-normal text-white">{title}</h2>
      <div className="mt-3 space-y-4 leading-relaxed text-white/70 [&_a]:text-white [&_a]:underline-offset-2 [&_a]:hover:underline [&_code]:rounded [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-white [&_strong]:font-normal [&_strong]:text-white">
        {children}
      </div>
    </section>
  );
}

export function CodeSurface({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[5px] border border-white/10 bg-surface-0">
      {title && (
        <div className="flex items-center justify-between border-b border-white/10 bg-surface-1 px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            {title}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </div>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-white">
        {children}
      </pre>
    </div>
  );
}

export function Callout({ kind = "info", children }: { kind?: "info" | "warn"; children: ReactNode }) {
  const styles =
    kind === "warn"
      ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-100"
      : "border-accent/30 bg-accent/5 text-white/80";
  return (
    <div className={`rounded-[5px] border px-4 py-3 text-sm leading-relaxed ${styles}`}>{children}</div>
  );
}

export function PropTable({
  rows,
}: {
  rows: readonly { name: string; type: string; required?: boolean; description: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-[5px] border border-white/10">
      <div className="grid grid-cols-[1fr_1fr_2fr] gap-4 border-b border-white/10 bg-surface-1 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        <span>Name</span>
        <span>Type</span>
        <span>Description</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.name}
          className={`grid grid-cols-[1fr_1fr_2fr] gap-4 px-4 py-3 ${
            i !== rows.length - 1 ? "border-b border-white/10" : ""
          }`}
        >
          <div className="font-mono text-[12px] text-white">
            {r.name}
            {r.required && <span className="ml-1.5 text-accent">*</span>}
          </div>
          <div className="font-mono text-[12px] text-white/55">{r.type}</div>
          <div className="text-[13px] leading-relaxed text-white/70">{r.description}</div>
        </div>
      ))}
    </div>
  );
}

// Re-exported here so pages can read the value without importing nav-data directly.
export { TOP_TABS };
