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
        {/* Apply the saved theme before paint to avoid a dark→light flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('oxar-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}",
          }}
        />
        <ThemeProvider>
          <PageWrapper>{children}</PageWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
