import { DM_Sans } from "next/font/google";

/**
 * Editorial landing typeface. DM Sans carries everything — body AND the giant
 * "OXAR." wordmarks / big numbers (DM Sans Bold), matching the Figma 1:1.
 */
export const dmSans = DM_Sans({
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

/** Display/wordmark face — same DM Sans family as the body (Figma-faithful). */
export const DISPLAY = "var(--font-dm-sans)";
