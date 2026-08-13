import localFont from "next/font/local";

/**
 * Editorial landing typeface. DM Sans carries everything — body AND the giant
 * "OXAR." wordmarks / big numbers (DM Sans Bold), matching the Figma 1:1.
 *
 * Served from the repo, not fetched from Google at build time. `next/font/google`
 * downloads the files on every build, so an outage at Google is an outage for our
 * deploys — one cost us a production build on 13 Aug with eight "Error while
 * requesting resource" failures while the code was perfectly fine. These are the
 * same variable files Google serves (latin + latin-ext), under the OFL.
 */
export const dmSans = localFont({
  src: [
    { path: "../../app/fonts/dm-sans-normal-latin.woff2", style: "normal", weight: "300 700" },
    { path: "../../app/fonts/dm-sans-normal-latin-ext.woff2", style: "normal", weight: "300 700" },
    { path: "../../app/fonts/dm-sans-italic-latin.woff2", style: "italic", weight: "300 700" },
    { path: "../../app/fonts/dm-sans-italic-latin-ext.woff2", style: "italic", weight: "300 700" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

/** Display/wordmark face — same DM Sans family as the body (Figma-faithful). */
export const DISPLAY = "var(--font-dm-sans)";
