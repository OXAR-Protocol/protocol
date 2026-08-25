import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import { PageWrapper } from "@/components/page-wrapper";

/** Brand serif, served from the repo — see the note in `landing-v2/fonts.ts` on
 *  why these aren't fetched from Google at build time. */
const instrumentSerif = localFont({
  src: [
    { path: "./fonts/instrument-serif-normal-latin.woff2", style: "normal", weight: "400" },
    { path: "./fonts/instrument-serif-normal-latin-ext.woff2", style: "normal", weight: "400" },
    { path: "./fonts/instrument-serif-italic-latin.woff2", style: "italic", weight: "400" },
    { path: "./fonts/instrument-serif-italic-latin-ext.woff2", style: "italic", weight: "400" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});
import { ThemeProvider } from "@/context/theme-context";
import "./globals.css";

// Draw into the display's safe areas; the .safe-* rules in globals.css pad them back out.
// Needed for the mobile shell, whose WebView is the root view and so renders under the
// status bar and home indicator. Two constraints forced this shape:
//   1. WebKit reads viewport-fit while parsing the document and ignores later mutations,
//      so this cannot be applied from a script.
//   2. It has to live in the ROOT layout. A `viewport` export in a nested layout reaches
//      the browser through the RSC payload rather than the initial head flush on Vercel,
//      which is just as late as mutating the tag.
// Safe for the marketing pages too: env(safe-area-inset-*) is 0 without insets.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// What a pasted OXAR link looks like in a chat, a feed, or a launch page. The old
// copy here still described the pre-pivot bond protocol — government-guaranteed
// paper at "4-18% APY" — which is not what v1 is, and it shipped with no image at
// all, so every share rendered a bare grey rectangle with a wrong sentence in it.
// One `metadataBase` covers both hosts: the marketing domain is the canonical one,
// and /og.jpg is served from either.
// Same string the landing sets for itself, so the tab title and the share card
// don't disagree about the wordmark's full stop.
const TITLE = "OXAR. — where your money sleeps";
const DESCRIPTION =
  "Wake it up. Earn yield, own real assets — no bank, no broker, no lock. Your money stays in your own wallet.";

export const metadata: Metadata = {
  metadataBase: new URL("https://oxar.app"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "OXAR",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "OXAR" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable}`}
    >
      {/* suppressHydrationWarning: wallet extensions (Trust/Bitwarden inpage scripts)
          inject attributes into <body> before React loads — harmless, but the
          mismatch makes dev re-mount the tree and flash white. */}
      <body
        suppressHydrationWarning
        className="bg-page text-ink font-sans antialiased overflow-x-hidden"
      >
        {/* Apply the saved theme before paint to avoid a dark→light flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              // Runs before the first paint: a dark-theme user must not see a white
              // flash, and a "system" user must not see the light one either.
              "try{var t=localStorage.getItem('oxar-theme');" +
              "if(t==='system')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';" +
              "if(t!=='light'&&t!=='dark')t='light';" +
              "document.documentElement.setAttribute('data-theme',t)}catch(e){}",
          }}
        />
        <ThemeProvider>
          <PageWrapper>{children}</PageWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
