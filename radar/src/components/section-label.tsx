export function SectionLabel({ children }: { children: string }) {
  return (
    <span className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-white/30">
      [ {children} ]
    </span>
  );
}
