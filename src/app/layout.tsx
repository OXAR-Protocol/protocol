import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { PageWrapper } from "@/components/page-wrapper";
import { ThemeProvider } from "@/context/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "ETNY — Own Real Gold, Digitally",
  description:
    "Buy, sell, and send real gold instantly. Backed by physical reserves. Starting from $5.",
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
