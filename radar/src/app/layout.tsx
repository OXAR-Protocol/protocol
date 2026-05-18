import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { RadarPrivyProvider } from "./privy-provider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "OXAR Radar — RWA Intelligence",
  description:
    "Risk monitoring and wallet intelligence for the Real World Assets market. Multi-chain coverage, AI-powered analysis, built-in emerging markets edge.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}
    >
      <body className="font-sans antialiased min-h-screen">
        <RadarPrivyProvider>{children}</RadarPrivyProvider>
      </body>
    </html>
  );
}
