"use client";

import { ThemeProvider } from "@/context/theme-context";
import { PageWrapper } from "@/components/landing/page-wrapper";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-surface-0 text-white font-sans antialiased overflow-x-hidden">
        <PageWrapper>{children}</PageWrapper>
      </div>
    </ThemeProvider>
  );
}
