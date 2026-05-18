import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { RadarPrivyProvider } from "./privy-provider";

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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased min-h-screen">
        <RadarPrivyProvider>{children}</RadarPrivyProvider>
      </body>
    </html>
  );
}
