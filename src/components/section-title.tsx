export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-sans font-normal text-white leading-tight">
      {children}
    </h2>
  );
}
