export const BANK_RATES: Record<string, number> = {
  UAH: 3,
  USD: 0.5,
  EUR: 0.3,
};

export const CURRENCY_COLORS: Record<string, { color: string; rgb: string }> = {
  UAH: { color: "rgba(114,162,240,1)", rgb: "114,162,240" },
  USD: { color: "rgba(139,92,246,1)", rgb: "139,92,246" },
  EUR: { color: "rgba(160,200,160,1)", rgb: "160,200,160" },
};

export function getBondColor(denomination: string) {
  return CURRENCY_COLORS[denomination] ?? CURRENCY_COLORS.UAH;
}

export function getBankRate(denomination: string): number {
  return BANK_RATES[denomination] ?? 1;
}
