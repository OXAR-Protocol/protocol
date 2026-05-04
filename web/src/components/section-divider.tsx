export function SectionDivider() {
  return (
    <div
      className="h-px w-full section-divider"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 80%, transparent 100%)",
      }}
    />
  );
}
