import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Instrument_Serif } from "next/font/google";
import { PageWrapper } from "@/components/page-wrapper";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});
import { ThemeProvider } from "@/context/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "OXAR Protocol — Real-World Yields, On-Chain",
  description:
    "Government-guaranteed bonds from emerging markets, tokenized on Solana. 4-18% APY. Deposit USDC, earn yield, trade freely.",
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
        className="bg-surface-0 text-white font-sans antialiased overflow-x-hidden"
      >
        {/* Pre-paint boot: apply the saved theme (avoids a dark→light flash), then flag the
            Capacitor shell. The shell renders edge-to-edge under the status bar and home
            indicator, and `env(safe-area-inset-*)` stays 0 until viewport-fit=cover — so
            this switches on the .safe-* rules in globals.css. A browser matches neither
            branch, leaving web layout untouched. See mobile/README.md. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('oxar-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}" +
              "try{if(window.Capacitor||navigator.userAgent.indexOf('OXARApp')>-1){document.documentElement.setAttribute('data-native','1');var m=document.querySelector('meta[name=viewport]');if(m)m.content+=',viewport-fit=cover'}}catch(e){}",
          }}
        />
        <ThemeProvider>
          <PageWrapper>{children}</PageWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
