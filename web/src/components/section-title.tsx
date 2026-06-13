export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[clamp(2rem,4.4vw,3.2rem)] font-serif font-normal text-white leading-[1.05] tracking-[-0.01em]">
      {children}
    </h2>
  );
}
