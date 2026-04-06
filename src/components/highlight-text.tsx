export function HighlightText({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-sm leading-relaxed text-white/30 [&>strong]:text-white [&>strong]:font-normal">
      {children}
    </p>
  );
}
