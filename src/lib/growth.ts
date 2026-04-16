export function generateGrowthCurve(
  startAmount: number,
  apy: number,
  points = 24,
): number[] {
  if (startAmount <= 0) return Array(points + 1).fill(0);
  const dailyRate = apy / 100 / 365;
  const daysPerPoint = 365 / points;
  const data: number[] = [];
  let nav = startAmount;
  for (let i = 0; i <= points; i++) {
    data.push(nav);
    nav *= 1 + dailyRate * daysPerPoint;
  }
  return data;
}
