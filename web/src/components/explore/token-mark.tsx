interface TokenMarkProps {
  symbol: string;
  color: string;
  rgb: string;
  size?: "sm" | "md";
}

export function TokenMark({ symbol, color, rgb, size = "md" }: TokenMarkProps) {
  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const text = size === "sm" ? "text-[10px]" : "text-[11px]";

  return (
    <div
      className={`${dim} rounded-[5px] border flex items-center justify-center shrink-0`}
      style={{
        borderColor: `rgba(${rgb},0.4)`,
        background: `linear-gradient(135deg, rgba(${rgb},0.15) 0%, rgba(${rgb},0.02) 100%)`,
      }}
    >
      <span
        className={`font-mono ${text} font-medium tracking-tight`}
        style={{ color }}
      >
        {symbol}
      </span>
    </div>
  );
}
