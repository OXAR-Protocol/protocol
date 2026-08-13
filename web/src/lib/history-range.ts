/** How far back the value series and everything read off it looks. Its own module
 *  because the chart, the figures under it and the day list all take the same
 *  window, and importing it from whichever component happened to declare it is how
 *  two of them end up describing different months. */
export const RANGES = [7, 30, 90, 365] as const;
export type Range = (typeof RANGES)[number];
