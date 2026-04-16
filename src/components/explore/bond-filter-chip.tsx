interface BondFilterChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function BondFilterChip({ active, onClick, children }: BondFilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "border-white/30 bg-white/[0.06] text-white"
          : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}
