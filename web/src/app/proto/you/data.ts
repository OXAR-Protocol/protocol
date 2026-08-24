/**
 * The numbers from the real screen, frozen.
 *
 * A prototype that needs a wallet is a prototype nobody looks at on a phone. These
 * are the actual figures from the reported screenshot, so the variants can be judged
 * on how they read rather than on whether the RPC answered.
 */
export const YOU = {
  address: "AkC8BHqLXe4Zt9vNfKp2sRj7Ym3cQaWdTb",
  short: "AkC8BH…mrwDtB",
  tiny: "akc8…wdtb",
  working: 112.03,
  positions: 2,
  since: "Jun 2026",
  total: 3553.66,
  changeUsd: -36.5,
  changePct: -0.83,
  tradeCost: -39.55,
  putIn: 21.56,
  tookOut: 961.66,
  trades: 82,
  tradeDays: 22,
  range: "30 days",
} as const;

/** A month of values that lands on the total, shaped like the screenshot's line. */
export const SERIES: number[] = (() => {
  const steps = [
    3990, 3988, 3986, 3900, 3898, 3880, 3878, 3876, 3874, 3872, 3870, 3868, 3866,
    3790, 3788, 3786, 3784, 3760, 3758, 3756, 3754, 3700, 3698, 3696, 3694, 3692,
    3690, 3688, 3686, 3554,
  ];
  return steps;
})();

export const LABELS = SERIES.map((_, i) => `d${i + 1}`);

export const usd = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const signedUsd = (n: number) => `${n < 0 ? "−" : "+"}${usd(n)}`;
