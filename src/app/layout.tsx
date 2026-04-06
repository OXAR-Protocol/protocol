import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { PageWrapper } from "@/components/page-wrapper";
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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="bg-surface-0 text-white font-sans antialiased overflow-x-hidden">
        <ThemeProvider>
          <PageWrapper>{children}</PageWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
