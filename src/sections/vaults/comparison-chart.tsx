"use client";

interface ComparisonChartProps {
  oxarData: number[];
  bankData: number[];
  color: string;
}

export function ComparisonChart({ oxarData, bankData, color }: ComparisonChartProps) {
  const allValues = [...oxarData, ...bankData];
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min + 0.01;
  const pad = 14;
  const h = 80;
  const chartH = h - pad;
  const w = 200;
  const labelW = 55;
  const totalW = w + labelW;

  function yPos(v: number) {
    return pad + chartH - ((v - min) / range) * chartH;
  }

  function toPoints(data: number[]) {
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        return `${x},${yPos(v)}`;
      })
      .join(" ");
  }

  function toArea(data: number[]) {
    return `M0,${h} L${data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        return `${x},${yPos(v)}`;
      })
      .join(" L")} L${w},${h} Z`;
  }

  const oxarEnd = oxarData[oxarData.length - 1];
  const bankEnd = bankData[bankData.length - 1];
  const oxarEndY = yPos(oxarEnd);
  const bankEndY = yPos(bankEnd);

  const gradId = `cgrad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg viewBox={`0 0 ${totalW} ${h}`} className="w-full h-[80px]">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={toArea(oxarData)} fill={`url(#${gradId})`} />

      <polyline
        className="vault-bank-line"
        points={toPoints(bankData)}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />

      <polyline
        points={toPoints(oxarData)}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <text x={w + 6} y={oxarEndY + 4} fill={color} fontSize="9" fontFamily="monospace">
        ${Math.round(oxarEnd).toLocaleString()}
      </text>
      <text
        x={w + 6}
        y={bankEndY + 4}
        className="vault-bank-label"
        fill="rgba(255,255,255,0.25)"
        fontSize="9"
        fontFamily="monospace"
      >
        ${Math.round(bankEnd).toLocaleString()}
      </text>
    </svg>
  );
}
