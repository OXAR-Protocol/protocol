import { DM_Sans } from "next/font/google";

/**
 * Editorial landing typeface. DM Sans (regular + italic) carries every
 * non-wordmark element; the giant "OXAR." marks use Helvetica Neue Bold via
 * the HELVETICA stack below (system font on the target platforms).
 */
export const dmSans = DM_Sans({
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
