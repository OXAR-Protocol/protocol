export function DetailRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-b-0">
      <dt className="text-white/30 uppercase tracking-wide text-[10px]">{label}</dt>
      <dd
        className="text-white/80 text-right truncate max-w-[60%]"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
