export function SectionLabel({ children }: { children: string }) {
  return (
    <span className="lowercase text-[clamp(15px,1.4vw,20px)] leading-none text-black/45">
      [ {children} ]
    </span>
  );
}
